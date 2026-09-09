r"""
Phase 1 - Live Distress-Sound Detection
AI Analysis Engine, Underground Mine Rescue Rover

Listens through the laptop microphone and flips a big always-on display to a
loud ALERT state when it detects a call for help. Three independent triggers:

  1. SPOKEN KEYWORD  - offline speech recognition (Vosk) hears "help",
     "mayday", "save me", ... This is the main, specific trigger: loud noise
     or music alone will NOT set it off.
  2. DISTRESS SOUND  - the AudioSet model (AST) labels the audio "Screaming",
     "Crying, sobbing", etc. above a confidence threshold.
  3. LOUDNESS burst  - optional (off by default), any loud vocal burst.

Run it:
    python -m phase1_distress_sound.distress_detector --device 2

Useful flags:
    --list-devices        show microphones and exit
    --device N            use input device number N
    --no-keyword          disable the spoken-"help" trigger
    --labels              print every sound label the model knows, then exit
    --threshold 0.5       override the distress-sound confidence threshold
    --fullscreen          start full screen (Esc exits, F toggles)
    --ui-only             run the display with fake data, no model / no mic

All tuning lives in phase1_distress_sound/config.py.
Debug what the mic/model/recogniser actually hear:
    python -m phase1_distress_sound.debug_listen --device 2
"""

from __future__ import annotations

import argparse
import queue
import sys
import threading
import time
import tkinter as tk
from collections import deque
from dataclasses import dataclass, field

import numpy as np

from . import config as C

try:
    import winsound  # Windows only; used for the alert beep

    _HAVE_WINSOUND = True
except ImportError:  # pragma: no cover - non-Windows fallback
    _HAVE_WINSOUND = False


# --------------------------------------------------------------------------
# Audio capture
# --------------------------------------------------------------------------
class RingBuffer:
    """Fixed-length mono float32 ring buffer, written from the audio thread,
    read from the inference thread."""

    def __init__(self, seconds: float, sample_rate: int):
        self.sample_rate = sample_rate
        self.size = int(seconds * sample_rate)
        self._buf = np.zeros(self.size, dtype=np.float32)
        self._write = 0
        self._filled = 0
        self._lock = threading.Lock()
        self.total_written = 0
        self.last_write_time = 0.0

    def write(self, samples: np.ndarray) -> None:
        samples = np.asarray(samples, dtype=np.float32).reshape(-1)
        n = samples.size
        if n == 0:
            return
        with self._lock:
            if n >= self.size:
                self._buf[:] = samples[-self.size :]
                self._write = 0
                self._filled = self.size
            else:
                end = self._write + n
                if end <= self.size:
                    self._buf[self._write : end] = samples
                else:
                    first = self.size - self._write
                    self._buf[self._write :] = samples[:first]
                    self._buf[: n - first] = samples[first:]
                self._write = end % self.size
                self._filled = min(self.size, self._filled + n)
            self.total_written += n
            self.last_write_time = time.monotonic()

    def read_last(self, seconds: float) -> np.ndarray:
        want = min(self.size, int(seconds * self.sample_rate))
        with self._lock:
            if self._filled < want:
                return np.array([], dtype=np.float32)
            start = (self._write - want) % self.size
            if start + want <= self.size:
                return self._buf[start : start + want].copy()
            first = self.size - start
            return np.concatenate((self._buf[start:], self._buf[: want - first]))


class Microphone:
    """Wraps a sounddevice InputStream and keeps the ring buffer fed.
    Restarts itself if the device drops out."""

    def __init__(self, ring: RingBuffer, device: int | None, sample_rate: int,
                 tap: "queue.Queue[np.ndarray] | None" = None):
        self._ring = ring
        self._device = device
        self._sample_rate = sample_rate
        self._tap = tap                 # raw (pre-gain) audio for the keyword spotter
        self._stream = None
        self.error: str | None = None
        self.device_name = "unknown"

    def _callback(self, indata, frames, time_info, status):  # noqa: ANN001
        if status:
            # overflow / underflow - log once in a while, never crash
            pass
        try:
            raw = indata[:, 0] if indata.ndim > 1 else indata
            if self._tap is not None:
                try:
                    self._tap.put_nowait(raw.copy())
                except queue.Full:
                    pass
            samples = np.clip(raw * C.INPUT_GAIN, -1.0, 1.0) if C.INPUT_GAIN != 1.0 else raw
            self._ring.write(samples)
        except Exception:  # pragma: no cover - defensive
            pass

    def start(self) -> None:
        import sounddevice as sd

        try:
            self._stream = sd.InputStream(
                samplerate=self._sample_rate,
                channels=1,
                dtype="float32",
                device=self._device,
                blocksize=int(self._sample_rate * 0.1),
                callback=self._callback,
            )
            self._stream.start()
            dev = sd.query_devices(self._device if self._device is not None else sd.default.device[0])
            self.device_name = dev["name"] if isinstance(dev, dict) else str(dev)
            self.error = None
        except Exception as exc:
            self.error = f"{type(exc).__name__}: {exc}"

    def stop(self) -> None:
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception:
                pass
            self._stream = None

    def ensure_alive(self) -> None:
        """Called periodically by the watchdog. Reopen if the stream died or
        no audio has arrived recently."""
        stale = (time.monotonic() - self._ring.last_write_time) > 2.0
        if self._stream is None or self.error is not None or stale:
            self.stop()
            self.start()


# --------------------------------------------------------------------------
# Spoken-keyword spotter (offline speech recognition via Vosk)
# --------------------------------------------------------------------------
class KeywordSpotter(threading.Thread):
    """Consumes raw mic audio and latches a hit whenever the recogniser's
    transcript (partial or final) contains one of C.KEYWORDS."""

    def __init__(self, tap: "queue.Queue[np.ndarray]", sample_rate: int):
        super().__init__(daemon=True)
        self._tap = tap
        self._sr = sample_rate
        self._stop = threading.Event()
        self._lock = threading.Lock()
        self.ready = False
        self.error: str | None = None
        self._kw: str | None = None
        self._text = ""
        self._hit_at = 0.0
        self._last_text = ""

    def stop(self) -> None:
        self._stop.set()

    def _load(self):
        import json

        import vosk

        vosk.SetLogLevel(-1)
        model = (vosk.Model(C.KEYWORD_MODEL_PATH) if C.KEYWORD_MODEL_PATH
                 else vosk.Model(lang="en-us"))
        # Full free recognition (NOT a restricted grammar). A tiny grammar makes
        # Vosk hallucinate "help" into every bit of background noise; free
        # recognition transcribes noise as whatever it really sounds like, and
        # we then confidence-check the words.
        rec = vosk.KaldiRecognizer(model, self._sr)
        rec.SetWords(True)
        return json, rec

    def run(self) -> None:
        try:
            print("[phase1] keyword spotter: loading speech model "
                  "(first run downloads ~40 MB)...", flush=True)
            js, rec = self._load()
            self.ready = True
            print("[phase1] keyword spotter ready - listening for: "
                  + ", ".join(sorted(C.KEYWORDS)), flush=True)
        except Exception as exc:  # noqa: BLE001
            self.error = f"{type(exc).__name__}: {exc}"
            print(f"[phase1] keyword spotter DISABLED ({self.error}). "
                  f"Install with:  .venv\\Scripts\\pip install vosk", flush=True)
            return

        # single keyword tokens (for the exact-partial fast path) and multi-word
        # phrases (checked against consecutive confident words in the final)
        single = {k for k in (kk.lower() for kk in C.KEYWORDS) if " " not in k}
        phrases = [k.lower().split() for k in (kk.lower() for kk in C.KEYWORDS) if " " in k]
        buf = np.zeros(0, dtype=np.float32)
        last_rms = 0.0
        while not self._stop.is_set():
            try:
                block = self._tap.get(timeout=0.2)
            except queue.Empty:
                continue
            buf = np.concatenate((buf, block))
            last_rms = max(last_rms * 0.6,
                           float(np.sqrt(np.mean(np.square(block))) + 1e-9))
            if buf.size < self._sr // 8:          # feed ~125 ms at a time
                continue
            pcm = np.clip(buf * 32767.0, -32768, 32767).astype("<i2").tobytes()
            buf = np.zeros(0, dtype=np.float32)

            if rec.AcceptWaveform(pcm):
                res = js.loads(rec.Result())
            else:
                # keep the live transcript fresh, but only DECIDE on finals -
                # partials from a small model flap between words and cause
                # false triggers
                p = js.loads(rec.PartialResult()).get("partial", "")
                if p:
                    with self._lock:
                        self._last_text = p
                continue

            text = res.get("text", "")
            words = res.get("result", [])           # [{word, conf, start, end}, ...]
            if text:
                with self._lock:
                    self._last_text = text
            rec.Reset()
            if last_rms < C.KEYWORD_MIN_RMS or not words:
                continue

            matched = None
            confs = {w["word"].lower(): w.get("conf", 0.0) for w in words}
            for kw in single:                       # a keyword word, said confidently
                if confs.get(kw, 0.0) >= C.KEYWORD_MIN_CONF:
                    matched = kw
                    break
            if matched is None:                     # or a multi-word phrase
                seq = [w["word"].lower() for w in words]
                cf = [w.get("conf", 0.0) for w in words]
                for ph in phrases:
                    for i in range(len(seq) - len(ph) + 1):
                        if seq[i:i + len(ph)] == ph and min(cf[i:i + len(ph)]) >= C.KEYWORD_MIN_CONF:
                            matched = " ".join(ph)
                            break
                    if matched:
                        break

            if matched:
                with self._lock:
                    self._kw, self._text, self._hit_at = matched, text.strip(), time.monotonic()

    def recent_hit(self, within: float | None = None):
        within = C.KEYWORD_HOLD_SECONDS if within is None else within
        with self._lock:
            if self._kw and (time.monotonic() - self._hit_at) <= within:
                return self._kw, self._text
        return None

    @property
    def last_text(self) -> str:
        with self._lock:
            return self._last_text


# --------------------------------------------------------------------------
# Inference worker
# --------------------------------------------------------------------------
@dataclass
class Result:
    ts: float
    ranked: list[tuple[str, float]] = field(default_factory=list)
    rms: float = 0.0
    distress_label: str | None = None
    distress_prob: float = 0.0
    mic_error: str | None = None
    infer_ms: float = 0.0
    loud_trigger: bool = False
    rms_ratio: float = 0.0
    baseline_rms: float = 0.0
    keyword: str | None = None          # spoken keyword that was heard
    keyword_text: str = ""              # what the recogniser transcribed
    keyword_ready: bool = False


class InferenceWorker(threading.Thread):
    def __init__(self, ring: RingBuffer, mic: Microphone, out: "queue.Queue[Result]",
                 threshold: float, ui_only: bool, spotter: "KeywordSpotter | None" = None):
        super().__init__(daemon=True)
        self._ring = ring
        self._mic = mic
        self._out = out
        self._threshold = threshold
        self._ui_only = ui_only
        self._spotter = spotter
        self._stop = threading.Event()
        self._clf = None
        self._rms_hist: deque[float] = deque(maxlen=40)   # ~24 s of window levels

    def _quiet_baseline(self) -> float:
        if len(self._rms_hist) < 6:
            return C.LOUDNESS_MIN_RMS
        return float(np.percentile(np.fromiter(self._rms_hist, float), 35))

    def stop(self) -> None:
        self._stop.set()

    def _load_model(self) -> None:
        if self._ui_only:
            return
        from shared.audio_model import AudioEventClassifier

        self._clf = AudioEventClassifier()

    def _fake_ranked(self) -> list[tuple[str, float]]:
        base = [("Speech", 0.31), ("Silence", 0.22), ("Inside, small room", 0.18),
                ("Breathing", 0.09), ("Music", 0.05), ("Static", 0.03)]
        if int(time.time()) % 12 < 2:  # brief simulated shout every ~12 s
            return [("Shout", 0.71), ("Yell", 0.44), ("Screaming", 0.33)] + base[:3]
        return base

    def run(self) -> None:
        try:
            self._load_model()
        except Exception as exc:
            self._out.put(Result(ts=time.time(),
                                  mic_error=f"model load failed: {exc}"))
            return

        print("[phase1] listening - speak normally, then shout to compare.\n"
              "         columns: <time>  TOP=<label>:<prob>  DISTRESS=<label>:<prob>  rms=<level>",
              flush=True)

        next_run = time.monotonic()
        while not self._stop.is_set():
            now = time.monotonic()
            if now < next_run:
                time.sleep(min(0.05, next_run - now))
                continue
            next_run = now + C.HOP_SECONDS

            if not self._ui_only:
                self._mic.ensure_alive()

            if self._ui_only:
                ranked = self._fake_ranked()
                rms = 0.05
                mic_err = None
            else:
                if self._mic.error:
                    self._out.put(Result(ts=time.time(), mic_error=self._mic.error))
                    continue
                window = self._ring.read_last(C.WINDOW_SECONDS)
                if window.size < int(0.4 * C.INPUT_SAMPLE_RATE):
                    continue  # not enough audio buffered yet
                rms = float(np.sqrt(np.mean(np.square(window))) + 1e-12)
                t0 = time.perf_counter()
                try:
                    ranked = self._clf.classify(window, C.INPUT_SAMPLE_RATE)
                except Exception as exc:  # keep the loop alive on a bad frame
                    print(f"[phase1] classify error: {exc}", flush=True)
                    continue
                infer_ms = (time.perf_counter() - t0) * 1000.0
                mic_err = None

            d_label, d_prob = None, 0.0
            for name, p in ranked:
                if name in C.DISTRESS_LABELS and p > d_prob:
                    d_label, d_prob = name, p

            # loudness fallback: sudden loud vocal burst the model calls "Speech"
            baseline = self._quiet_baseline()
            ratio = rms / max(baseline, 1e-4)
            vocal_top = any(n in C.LOUDNESS_VOCAL_LABELS for n, _ in ranked[:3])
            loud_trigger = bool(
                C.LOUDNESS_TRIGGER_ENABLED
                and rms >= C.LOUDNESS_MIN_RMS
                and ratio >= C.LOUDNESS_RMS_RATIO
                and vocal_top
            )
            self._rms_hist.append(rms)

            # spoken-keyword path (main trigger)
            kw, kw_text, kw_ready = None, "", False
            if self._spotter is not None:
                kw_ready = self._spotter.ready and self._spotter.error is None
                hit = self._spotter.recent_hit()
                if hit:
                    kw, kw_text = hit
                elif kw_ready:
                    kw_text = self._spotter.last_text

            res = Result(
                ts=time.time(),
                ranked=ranked,
                rms=rms,
                distress_label=d_label,
                distress_prob=d_prob,
                mic_error=mic_err,
                infer_ms=locals().get("infer_ms", 0.0),
                loud_trigger=loud_trigger,
                rms_ratio=ratio,
                baseline_rms=baseline,
                keyword=kw,
                keyword_text=kw_text,
                keyword_ready=kw_ready,
            )
            self._out.put(res)

            top_name, top_p = (ranked[0] if ranked else ("-", 0.0))
            fired = d_prob >= self._threshold or loud_trigger or kw is not None
            print(f"  {time.strftime('%H:%M:%S')}  TOP={top_name}:{top_p:.2f}   "
                  f"DISTRESS={d_label or '-'}:{d_prob:.2f}   "
                  f"KW={kw or '-'}   rms={rms:.4f}"
                  f"{'  <<< ALERT' if fired else ''}"
                  f"{' [keyword]' if kw else ''}{' [loud]' if loud_trigger else ''}",
                  flush=True)


# --------------------------------------------------------------------------
# Display
# --------------------------------------------------------------------------
COL_BG = "#0f1115"
COL_BG_ALERT = "#b00020"
COL_BG_MIC = "#5a3d00"
COL_IDLE = "#7CFC98"
COL_TEXT = "#e8e8e8"
COL_DIM = "#9aa0a6"


class Display:
    def __init__(self, root: tk.Tk, results: "queue.Queue[Result]",
                 threshold: float, model_name: str):
        self.root = root
        self.results = results
        self.threshold = threshold
        self.model_name = model_name

        self._consec = 0
        self._alert_until = 0.0
        self._alerting = False
        self._alert_label: str | None = None   # label that actually triggered the alert
        self._alert_prob = 0.0
        self._last_seen_ts = 0.0
        self._fullscreen = bool(C.START_FULLSCREEN)

        root.title("AI Analysis Engine - Distress-Sound Detection (Phase 1)")
        root.configure(bg=COL_BG)
        root.geometry("1024x640")
        root.minsize(720, 480)
        root.attributes("-fullscreen", self._fullscreen)
        root.bind("<Escape>", lambda e: self._exit())
        root.bind("<f>", lambda e: self._toggle_fullscreen())
        root.bind("<F>", lambda e: self._toggle_fullscreen())
        root.protocol("WM_DELETE_WINDOW", self._exit)

        self.state_lbl = tk.Label(root, text="STARTING...", font=("Segoe UI", 54, "bold"),
                                  fg=COL_IDLE, bg=COL_BG)
        self.state_lbl.pack(pady=(28, 6))

        self.top_lbl = tk.Label(root, text="loading model...", font=("Segoe UI", 30),
                                fg=COL_TEXT, bg=COL_BG)
        self.top_lbl.pack(pady=4)

        self.conf_bar = tk.Canvas(root, height=26, bg="#1c1f26", highlightthickness=0)
        self.conf_bar.pack(fill="x", padx=60, pady=(6, 14))

        self.list_lbl = tk.Label(root, text="", font=("Consolas", 18), justify="left",
                                 fg=COL_DIM, bg=COL_BG)
        self.list_lbl.pack(pady=6)

        self.level_bar = tk.Canvas(root, height=12, bg="#1c1f26", highlightthickness=0)
        self.level_bar.pack(fill="x", padx=60, pady=(10, 4))

        self.footer = tk.Label(root, text="", font=("Segoe UI", 12), fg=COL_DIM, bg=COL_BG)
        self.footer.pack(side="bottom", pady=10)

        self.root.after(80, self._tick)

    # -- keys / lifecycle --
    def _toggle_fullscreen(self) -> None:
        self._fullscreen = not self._fullscreen
        self.root.attributes("-fullscreen", self._fullscreen)

    def _exit(self) -> None:
        self.root.quit()

    # -- rendering --
    def _beep(self) -> None:
        if C.AUDIBLE_BEEP_ON_ALERT and _HAVE_WINSOUND:
            threading.Thread(target=lambda: winsound.Beep(1000, 250), daemon=True).start()

    def _draw_bar(self, canvas: tk.Canvas, frac: float, color: str) -> None:
        canvas.delete("all")
        w = canvas.winfo_width() or 1
        canvas.create_rectangle(0, 0, int(w * max(0.0, min(1.0, frac))),
                                int(canvas["height"]), fill=color, width=0)
        # threshold tick on the confidence bar
        if canvas is self.conf_bar:
            x = int(w * self.threshold)
            canvas.create_line(x, 0, x, int(canvas["height"]), fill="#ffffff", width=2)

    def _latest(self) -> Result | None:
        latest = None
        try:
            while True:
                latest = self.results.get_nowait()
        except queue.Empty:
            pass
        return latest

    def _tick(self) -> None:
        res = self._latest()
        now = time.time()

        if res is not None:
            self._last_seen_ts = res.ts

            if res.mic_error:
                self._render_mic_error(res.mic_error)
                self.root.after(80, self._tick)
                return

            # trigger: spoken keyword (main) OR model distress label OR loudness
            kw_hit = res.keyword is not None
            model_hit = res.distress_prob >= self.threshold
            if kw_hit or model_hit or res.loud_trigger:
                self._consec += 1
            else:
                self._consec = 0
            if self._consec >= C.CONSECUTIVE_HITS_TO_ALERT:
                self._alert_until = now + C.ALERT_HOLD_SECONDS
                if kw_hit:
                    heard = res.keyword_text or res.keyword
                    self._alert_label = f'HEARD:  "{heard}"'
                    self._alert_prob = 1.0
                elif model_hit:
                    self._alert_label = res.distress_label
                    self._alert_prob = res.distress_prob
                else:
                    self._alert_label = f"LOUD VOCAL BURST  (x{res.rms_ratio:.1f} louder)"
                    self._alert_prob = min(0.99, res.rms_ratio / 10.0)

            self._render_normal(res)

        # stale-feed guard (worker died / no results for a while)
        if now - self._last_seen_ts > 4.0 and self._last_seen_ts > 0:
            self.state_lbl.config(text="NO AUDIO FEED", fg="#ffd166", bg=COL_BG)

        self.root.after(80, self._tick)

    def _render_mic_error(self, msg: str) -> None:
        self.root.configure(bg=COL_BG_MIC)
        for wdg in (self.state_lbl, self.top_lbl, self.list_lbl, self.footer):
            wdg.config(bg=COL_BG_MIC)
        self.state_lbl.config(text="MICROPHONE PROBLEM", fg="#ffd166")
        self.top_lbl.config(text="reconnecting to the mic...", fg=COL_TEXT)
        self.list_lbl.config(text=str(msg)[:120])
        self._consec = 0

    def _render_normal(self, res: Result) -> None:
        alerting = time.time() < self._alert_until
        bg = COL_BG_ALERT if alerting else COL_BG
        self.root.configure(bg=bg)
        for wdg in (self.state_lbl, self.top_lbl, self.list_lbl, self.footer):
            wdg.config(bg=bg)

        if alerting and not self._alerting:
            self._beep()
        self._alerting = alerting

        top_name, top_p = (res.ranked[0] if res.ranked else ("-", 0.0))

        if alerting:
            self.state_lbl.config(text="⚠  DISTRESS SIGNAL DETECTED", fg="#ffffff")
            shown = self._alert_label or res.distress_label or top_name
            shownp = max(self._alert_prob, res.distress_prob)
            if shown.startswith(("LOUD", "HEARD")):
                self.top_lbl.config(text=shown, fg="#ffffff")
            else:
                self.top_lbl.config(text=f"{shown}   {shownp*100:4.0f}% confidence", fg="#ffffff")
            self._draw_bar(self.conf_bar, shownp, "#ffd1d1")
        else:
            self.state_lbl.config(text="LISTENING", fg=COL_IDLE)
            hint = "  (quiet)" if res.rms < 5e-4 else ""
            self.top_lbl.config(text=f"{top_name}   {top_p*100:4.0f}%{hint}", fg=COL_TEXT)
            self._draw_bar(self.conf_bar, top_p, "#5b8def")

        lines = []
        for name, p in res.ranked[: C.SHOW_TOP_N]:
            mark = " *" if name in C.DISTRESS_LABELS else "  "
            lines.append(f"{mark} {p*100:5.1f}%  {name}")
        heard = res.keyword_text.strip()
        if heard:
            lines.append("")
            lines.append(f'  heard: "{heard[-60:]}"')
        self.list_lbl.config(text="\n".join(lines))

        lvl = float(min(1.0, res.rms * 12))
        self._draw_bar(self.level_bar, lvl, "#3ddc97" if not alerting else "#ffd1d1")

        kw_state = ("keywords: on" if res.keyword_ready else
                    "keywords: loading" if C.KEYWORD_ENABLED else "keywords: off")
        self.footer.config(
            text=(f"{kw_state}   |   sound threshold: {self.threshold:.2f}   |   "
                  f"infer {res.infer_ms:.0f} ms   |   Esc quit  ·  F fullscreen")
        )


# --------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------
def _print_labels() -> None:
    from shared.audio_model import AudioEventClassifier

    clf = AudioEventClassifier(verbose=False)
    for i, name in enumerate(clf.labels):
        mark = "  <-- in DISTRESS_LABELS" if name in C.DISTRESS_LABELS else ""
        print(f"{i:3d}  {name}{mark}")


def _mic_silence_check(device: int | None) -> None:
    """Grab ~1 s from the chosen input and shout if it's basically silent -
    usually means a virtual / muted device is selected (e.g. a Sonar VAD)."""
    try:
        import sounddevice as sd

        rec = sd.rec(int(1.0 * C.INPUT_SAMPLE_RATE), samplerate=C.INPUT_SAMPLE_RATE,
                     channels=1, dtype="float32", device=device)
        sd.wait()
        peak = float(np.max(np.abs(rec)))
        name = sd.query_devices(device if device is not None else sd.default.device[0])["name"]
        if peak < 0.006:
            print("\n" + "!" * 68, file=sys.stderr)
            print(f"[phase1] MIC LOOKS SILENT  (device: {name.strip()}, peak={peak:.4f})",
                  file=sys.stderr)
            print("[phase1] It will not hear a shout. Pick a real microphone:", file=sys.stderr)
            for i, d in enumerate(sd.query_devices()):
                if d["max_input_channels"] > 0:
                    print(f"           --device {i}   {d['name'].strip()}", file=sys.stderr)
            print("[phase1] then rerun, e.g.:  run_phase1.bat --device 2", file=sys.stderr)
            print("[phase1] to see exactly what the model hears:  "
                  "python -m phase1_distress_sound.debug_listen --device 2", file=sys.stderr)
            print("!" * 68 + "\n", file=sys.stderr)
        else:
            print(f"[phase1] mic OK  (device: {name.strip()}, 1 s peak={peak:.3f})")
    except Exception as exc:  # never let the check itself stop the app
        print(f"[phase1] (mic pre-check skipped: {exc})", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Phase 1 - live distress-sound detection")
    ap.add_argument("--list-devices", action="store_true", help="list microphones and exit")
    ap.add_argument("--device", type=int, default=None, help="input device index")
    ap.add_argument("--labels", action="store_true", help="print all model labels and exit")
    ap.add_argument("--threshold", type=float, default=C.DISTRESS_THRESHOLD,
                    help=f"distress confidence threshold (default {C.DISTRESS_THRESHOLD})")
    ap.add_argument("--fullscreen", action="store_true", help="start full screen")
    ap.add_argument("--no-keyword", action="store_true",
                    help="disable the spoken-keyword ('help') trigger")
    ap.add_argument("--ui-only", action="store_true",
                    help="run the display with fake data (no model, no mic)")
    args = ap.parse_args(argv)

    if args.list_devices:
        import sounddevice as sd

        print(sd.query_devices())
        return 0

    if args.labels:
        _print_labels()
        return 0

    if args.fullscreen:
        C.START_FULLSCREEN = True

    use_keyword = C.KEYWORD_ENABLED and not args.no_keyword and not args.ui_only
    tap: "queue.Queue[np.ndarray] | None" = queue.Queue(maxsize=64) if use_keyword else None

    ring = RingBuffer(max(C.WINDOW_SECONDS + 1.0, 4.0), C.INPUT_SAMPLE_RATE)
    mic = Microphone(ring, args.device, C.INPUT_SAMPLE_RATE, tap=tap)
    if not args.ui_only:
        _mic_silence_check(args.device)
        mic.start()
        if mic.error:
            print(f"[phase1] WARNING: mic did not start cleanly: {mic.error}\n"
                  f"         the app will keep retrying; try --list-devices / --device N",
                  file=sys.stderr)

    spotter = None
    if use_keyword:
        spotter = KeywordSpotter(tap, C.INPUT_SAMPLE_RATE)
        spotter.start()

    results: "queue.Queue[Result]" = queue.Queue()
    worker = InferenceWorker(ring, mic, results, args.threshold, args.ui_only, spotter)
    worker.start()

    model_name = "ui-only (fake data)" if args.ui_only else "AST / AudioSet (527 classes)"
    root = tk.Tk()
    Display(root, results, args.threshold, model_name)
    try:
        root.mainloop()
    finally:
        worker.stop()
        if spotter is not None:
            spotter.stop()
        mic.stop()
        try:
            root.destroy()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
