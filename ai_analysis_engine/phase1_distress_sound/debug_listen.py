r"""
Phase 1 debug tool - find out why a shout is or isn't being detected.

It records a few seconds from the mic (shout "HELP" a few times while it runs),
saves the clip, then runs the SAME model the live app uses and prints, for every
rolling window, the full ranked label list and the audio level - plus a summary
of the best score each distress label reached and what threshold would have
caught it.

    python -m phase1_distress_sound.debug_listen                 # record 8 s and analyse
    python -m phase1_distress_sound.debug_listen --seconds 10
    python -m phase1_distress_sound.debug_listen --device 2
    python -m phase1_distress_sound.debug_listen --list-devices
    python -m phase1_distress_sound.debug_listen --wav assets\phase1_debug_XXXX.wav   # re-analyse a saved clip
"""

from __future__ import annotations

import argparse
import os
import time
import wave

import numpy as np

from . import config as C
from shared.audio_model import TARGET_SR, AudioEventClassifier

ASSETS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")


def _list_devices() -> None:
    import sounddevice as sd

    print(sd.query_devices())
    try:
        di = sd.default.device
        print(f"\ndefault input device index: {di[0]}  ->  {sd.query_devices(di[0])['name']}")
    except Exception:
        pass


def _record(seconds: float, device: int | None) -> np.ndarray:
    import sounddevice as sd

    print(f"\nRecording {seconds:.0f} s from "
          f"{'default mic' if device is None else f'device {device}'} ...")
    for n in (3, 2, 1):
        print(f"  {n}...", end="", flush=True)
        time.sleep(1)
    print("  GO - shout HELP now!", flush=True)
    audio = sd.rec(int(seconds * TARGET_SR), samplerate=TARGET_SR, channels=1,
                   dtype="float32", device=device)
    sd.wait()
    print("done.\n")
    return audio.reshape(-1)


def _scan_devices(seconds: float) -> None:
    """Record a short burst from every input device while you clap/shout, then
    rank them by how loud they actually captured it. Use the winner as --device."""
    import sounddevice as sd

    cands = [(i, d) for i, d in enumerate(sd.query_devices()) if d["max_input_channels"] > 0]
    print(f"\nScanning {len(cands)} input devices. When each one says GO, "
          f"CLAP HARD once and shout HELP.\n")
    rows = []
    for i, d in cands:
        name = d["name"].strip()[:48]
        print(f"  device {i:2d}  {name}")
        try:
            sr = int(d["default_samplerate"]) or 16000
            print("     get ready... GO!", flush=True)
            rec = sd.rec(int(seconds * sr), samplerate=sr, channels=1,
                         dtype="float32", device=i)
            sd.wait()
            rec = rec.reshape(-1)
            peak = float(np.max(np.abs(rec)))
            rms = float(np.sqrt(np.mean(rec ** 2)))
            rows.append((peak, rms, i, name))
            print(f"     peak={peak:.3f}  rms={rms:.4f}")
        except Exception as exc:
            print(f"     (unavailable: {exc})")
    rows.sort(reverse=True)
    print("\n" + "=" * 68)
    print("LOUDEST FIRST  -  use the top one that is a real mic:")
    for peak, rms, i, name in rows:
        flag = "  <-- try this" if peak > 0.25 else ("  (weak)" if peak < 0.08 else "")
        print(f"  --device {i:2d}   peak={peak:.3f}  rms={rms:.4f}   {name}{flag}")
    print("=" * 68)
    print("If even the best peak is < 0.25, the OS is limiting the mic. Turn OFF all")
    print("microphone enhancements (see below), or use a USB / phone headset mic.")


def _save_wav(wav: np.ndarray, path: str) -> None:
    pcm = np.clip(wav, -1, 1)
    pcm = (pcm * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(TARGET_SR)
        w.writeframes(pcm.tobytes())
    print(f"clip saved: {path}")


def _load_wav(path: str) -> np.ndarray:
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
    data = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    if w.getnchannels() > 1:
        data = data.reshape(-1, w.getnchannels()).mean(axis=1)
    if sr != TARGET_SR:
        from scipy.signal import resample_poly
        from math import gcd
        g = gcd(sr, TARGET_SR)
        data = resample_poly(data, TARGET_SR // g, sr // g).astype(np.float32)
    return data


def _keyword_report(wav: np.ndarray) -> None:
    """Run the same free-recognition + per-word-confidence pass the live app
    uses and show what it transcribed and whether a keyword would fire."""
    if not C.KEYWORD_ENABLED:
        print("\nKEYWORD PATH: disabled in config (KEYWORD_ENABLED = False)")
        return
    try:
        import json

        import vosk

        vosk.SetLogLevel(-1)
        model = (vosk.Model(C.KEYWORD_MODEL_PATH) if C.KEYWORD_MODEL_PATH
                 else vosk.Model(lang="en-us"))
        rec = vosk.KaldiRecognizer(model, TARGET_SR)
        rec.SetWords(True)
    except Exception as exc:
        print(f"\nKEYWORD PATH: Vosk unavailable ({exc}). "
              f"Install with  .venv\\Scripts\\pip install vosk")
        return

    single = {k for k in (kk.lower() for kk in C.KEYWORDS) if " " not in k}
    phrases = [k.lower().split() for k in (kk.lower() for kk in C.KEYWORDS) if " " in k]

    pcm = np.clip(wav * 32767.0, -32768, 32767).astype("<i2")
    step = TARGET_SR // 8
    segs, hit = [], None
    for i in list(range(0, len(pcm), step)) + [None]:
        if i is None:
            r = json.loads(rec.FinalResult())
        elif rec.AcceptWaveform(pcm[i:i + step].tobytes()):
            r = json.loads(rec.Result())
        else:
            continue
        ws = r.get("result", [])
        if not ws:
            continue
        segs.append(" ".join(f"{w['word']}({w.get('conf', 0):.2f})" for w in ws))
        confs = {w["word"].lower(): w.get("conf", 0.0) for w in ws}
        for kw in single:
            if confs.get(kw, 0.0) >= C.KEYWORD_MIN_CONF:
                hit = hit or kw
        seq = [w["word"].lower() for w in ws]
        cf = [w.get("conf", 0.0) for w in ws]
        for ph in phrases:
            for j in range(len(seq) - len(ph) + 1):
                if seq[j:j + len(ph)] == ph and min(cf[j:j + len(ph)]) >= C.KEYWORD_MIN_CONF:
                    hit = hit or " ".join(ph)

    print("\n" + "=" * 68)
    print(f"KEYWORD PATH (offline speech, needs conf >= {C.KEYWORD_MIN_CONF}):")
    for s in segs or ["(nothing recognised)"]:
        print(f"   {s}")
    if hit:
        print(f"  -> would FIRE the alert  (matched '{hit}')")
    else:
        print("  -> no confident keyword. If you clearly yelled 'HELP' and the word")
        print("     shows above but below the confidence bar, lower KEYWORD_MIN_CONF.")
    print("=" * 68)


def _level_report(wav: np.ndarray) -> None:
    peak = float(np.max(np.abs(wav))) if wav.size else 0.0
    rms = float(np.sqrt(np.mean(wav ** 2))) if wav.size else 0.0
    print("=" * 68)
    print(f"CLIP LEVEL   peak={peak:.3f}   rms={rms:.4f}   ({wav.size / TARGET_SR:.1f} s)")
    if peak < 0.02:
        print("  >>> MIC IS BASICALLY SILENT. The model can only hear noise.")
        print("      Fix the input before anything else: Windows Settings > System >")
        print("      Sound > Input - pick the right mic, raise the level, test it.")
        print("      Also try  --list-devices  and pass  --device N  for a real mic.")
    elif peak < 0.15:
        print("  >>> Mic level is low. A shout should peak above ~0.3. Raise mic gain.")
    else:
        print("  mic level looks usable.")
    print("=" * 68)


def _analyse(clf: AudioEventClassifier, wav: np.ndarray) -> None:
    win = int(C.WINDOW_SECONDS * TARGET_SR)
    hop = int(0.5 * TARGET_SR)
    distress_best: dict[str, float] = {k: 0.0 for k in C.DISTRESS_LABELS}
    rms_hist: list[float] = []
    peak_ratio = 0.0
    loud_would_fire = False

    print("\nROLLING WINDOWS (what the live app sees):")
    print(f"{'t(s)':>6} {'rms':>7} {'xbase':>6}   top labels (label:prob)")
    for start in range(0, max(1, wav.size - win + 1), hop):
        seg = wav[start:start + win]
        if seg.size < win:
            seg = np.pad(seg, (0, win - seg.size))
        rms = float(np.sqrt(np.mean(seg ** 2)))
        ranked = clf.classify(seg, TARGET_SR)
        top = ranked[:6]
        for name, p in ranked:
            if name in distress_best and p > distress_best[name]:
                distress_best[name] = p

        base = (float(np.percentile(rms_hist, 35)) if len(rms_hist) >= 6
                else C.LOUDNESS_MIN_RMS)
        ratio = rms / max(base, 1e-4)
        peak_ratio = max(peak_ratio, ratio)
        vocal_top = any(n in C.LOUDNESS_VOCAL_LABELS for n, _ in ranked[:3])
        loud = (rms >= C.LOUDNESS_MIN_RMS and ratio >= C.LOUDNESS_RMS_RATIO and vocal_top)
        loud_would_fire = loud_would_fire or loud
        rms_hist.append(rms)

        model_hit = any(n in C.DISTRESS_LABELS and p >= C.DISTRESS_THRESHOLD for n, p in ranked)
        mark = "  <<< ALERT" if (model_hit or loud) else ""
        mark += " [loud]" if loud else ""
        lab = "  ".join(f"{n}:{p:.2f}" for n, p in top)
        print(f"{start / TARGET_SR:6.1f} {rms:7.4f} {ratio:6.1f}   {lab}{mark}")

    # loudest 1 s - is the 2 s window diluting a short shout?
    if wav.size >= TARGET_SR:
        e = np.convolve(wav ** 2, np.ones(TARGET_SR) / TARGET_SR, mode="valid")
        c = int(np.argmax(e))
        loud = wav[c:c + TARGET_SR]
        print("\nLOUDEST 1 s SEGMENT ALONE (tests whether the 2 s window dilutes a short shout):")
        for name, p in clf.classify(loud, TARGET_SR)[:12]:
            tag = "  [distress]" if name in C.DISTRESS_LABELS else ""
            print(f"   {p:5.2f}  {name}{tag}")

    print("\n" + "=" * 68)
    print("BEST SCORE PER DISTRESS LABEL across the whole clip:")
    for name, p in sorted(distress_best.items(), key=lambda kv: -kv[1]):
        bar = "#" * int(p * 40)
        print(f"   {p:5.2f}  {name:<20} {bar}")
    best_label, best_p = max(distress_best.items(), key=lambda kv: kv[1])
    print("-" * 68)
    print(f"current DISTRESS_THRESHOLD = {C.DISTRESS_THRESHOLD}")
    if best_p >= C.DISTRESS_THRESHOLD:
        print(f"VERDICT: a window DID reach the threshold ({best_label} {best_p:.2f}). "
              f"If the live app didn't fire, the issue is capture timing or the "
              f"consecutive-hits setting - not the model.")
    elif best_p >= 0.15:
        print(f"VERDICT: best distress score was {best_label} {best_p:.2f} - real but "
              f"below threshold. Lower DISTRESS_THRESHOLD to about {max(0.2, best_p - 0.07):.2f} "
              f"in phase1_distress_sound/config.py.")
    else:
        print(f"VERDICT (model path): almost no distress (best {best_label} {best_p:.2f}). "
              f"The sound wasn't loud/harsh enough for AudioSet's 'Shout'/'Screaming' "
              f"classes - they need real sustained yelling, not a firm word.")
    print("-" * 68)
    print(f"LOUDNESS PATH:  peak was x{peak_ratio:.1f} the quiet baseline "
          f"(needs >= x{C.LOUDNESS_RMS_RATIO:.1f} AND rms >= {C.LOUDNESS_MIN_RMS}).")
    if loud_would_fire:
        print("  -> the loudness fallback WOULD have fired on this clip. Good.")
    elif peak_ratio >= 2.0:
        print(f"  -> close. Lower LOUDNESS_RMS_RATIO to ~{max(2.0, peak_ratio - 0.5):.1f} "
              f"in config.py, or shout louder / closer to the mic.")
    else:
        print("  -> the yell barely rose above your speaking level. Shout MUCH louder,")
        print("     sustained for a full second, closer to the mic - or raise the Windows")
        print("     mic level. A real yell should be x4-x10 the speaking baseline.")
    print("=" * 68)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Phase 1 distress-detection debugger")
    ap.add_argument("--seconds", type=float, default=8.0)
    ap.add_argument("--device", type=int, default=None)
    ap.add_argument("--gain", type=float, default=C.INPUT_GAIN,
                    help=f"software gain applied before analysis (config INPUT_GAIN={C.INPUT_GAIN})")
    ap.add_argument("--list-devices", action="store_true")
    ap.add_argument("--scan-devices", action="store_true",
                    help="record a burst from every input and rank by captured loudness")
    ap.add_argument("--wav", default=None, help="analyse an existing wav instead of recording")
    args = ap.parse_args(argv)

    if args.list_devices:
        _list_devices()
        return 0
    if args.scan_devices:
        _scan_devices(3.0)
        return 0

    os.makedirs(ASSETS, exist_ok=True)
    if args.wav:
        wav = _load_wav(args.wav)
        print(f"loaded {args.wav}")
    else:
        wav = _record(args.seconds, args.device)
        out = os.path.join(ASSETS, f"phase1_debug_{time.strftime('%H%M%S')}.wav")
        _save_wav(wav, out)

    if args.gain != 1.0:
        wav = np.clip(wav * args.gain, -1.0, 1.0)
        print(f"(applied software gain x{args.gain})")

    _level_report(wav)
    _keyword_report(wav)
    print("\nloading sound model...")
    clf = AudioEventClassifier(verbose=False)
    _analyse(clf, wav)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
