"""
Phase 0 smoke test.

Checks, with one short line of output each:
  1. audio model     - AST / AudioSet loads from the hub, N classes available
  2. microphone      - a few seconds of live capture returns real samples
  3. live display    - tkinter (stdlib) can open a window on this machine
  4. webcam          - OpenCV opens the camera and returns a real frame
  5. person detector - YOLO loads and runs on a sample frame

Run:
    python -m phase0_setup.smoke_test
    python -m phase0_setup.smoke_test --seconds 5 --device 1
    python -m phase0_setup.smoke_test --skip-camera        (audio-only, faster)
"""

from __future__ import annotations

import argparse
import sys
import time

import numpy as np

PASS = "PASS"
FAIL = "FAIL"


def check_audio_model() -> tuple[str, str]:
    try:
        from shared.audio_model import AudioEventClassifier

        clf = AudioEventClassifier(verbose=False)
        n = clf.num_classes
        rng = np.random.default_rng(0)
        noise = (rng.standard_normal(16_000) * 0.2).astype(np.float32)
        top = clf.classify(noise, 16_000)[:1]
        top_txt = f"{top[0][0]}={top[0][1]:.2f}" if top else "no output"
        return PASS, f"audio model loaded, {n} classes available (noise -> {top_txt})"
    except Exception as exc:
        return FAIL, f"audio model: {type(exc).__name__}: {exc}"


def check_microphone(seconds: float, device: int | None) -> tuple[str, str]:
    try:
        import sounddevice as sd

        sr = 16_000
        rec = sd.rec(int(seconds * sr), samplerate=sr, channels=1,
                     dtype="float32", device=device)
        sd.wait()
        rec = rec.reshape(-1)
        rms = float(np.sqrt(np.mean(np.square(rec))) + 1e-12)
        peak = float(np.max(np.abs(rec)))
        if rec.size == 0:
            return FAIL, "mic captured 0 samples"
        note = "" if peak > 1e-4 else "  (near-silent - check the input volume / correct mic)"
        return PASS, (f"mic captured {rec.size} samples @ {sr} Hz, "
                      f"rms={rms:.4f} peak={peak:.3f}{note}")
    except Exception as exc:
        return FAIL, f"microphone: {type(exc).__name__}: {exc}"


def check_display() -> tuple[str, str]:
    try:
        import tkinter as tk

        root = tk.Tk()
        root.withdraw()
        root.update()
        root.destroy()
        return PASS, "tkinter window system available (live display OK)"
    except Exception as exc:
        return FAIL, f"display: {type(exc).__name__}: {exc}"


def check_webcam(index: int) -> tuple[str, str]:
    try:
        import cv2

        cap = None
        for backend in (cv2.CAP_DSHOW, cv2.CAP_ANY):
            cap = cv2.VideoCapture(index, backend)
            if cap.isOpened():
                break
            cap.release()
        if cap is None or not cap.isOpened():
            return FAIL, f"webcam {index} did not open (try --camera 1)"
        frame = None
        for _ in range(10):
            ok, f = cap.read()
            if ok and f is not None:
                frame = f
                break
        cap.release()
        if frame is None:
            return FAIL, f"webcam {index} opened but returned no frame"
        h, w = frame.shape[:2]
        return PASS, f"webcam frame captured, {w}x{h}"
    except Exception as exc:
        return FAIL, f"webcam: {type(exc).__name__}: {exc}"


def check_person_detector() -> tuple[str, str]:
    try:
        import os

        from shared.person_detector import PersonDetector

        weights = os.path.join(os.path.dirname(os.path.dirname(__file__)), "yolov8n.pt")
        det = PersonDetector(model_path=weights, verbose=False)
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        n = len(det.detect(blank))
        return PASS, f"detector loaded, ran on a sample frame, found {n} people (expected 0)"
    except Exception as exc:
        return FAIL, f"person detector: {type(exc).__name__}: {exc}"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Phase 0 smoke test (audio + mic + display + webcam + detector)")
    ap.add_argument("--seconds", type=float, default=3.0, help="mic capture length")
    ap.add_argument("--device", type=int, default=None, help="input (microphone) device index")
    ap.add_argument("--camera", type=int, default=0, help="webcam index")
    ap.add_argument("--skip-camera", action="store_true", help="skip webcam + detector checks")
    ap.add_argument("--list-devices", action="store_true")
    args = ap.parse_args(argv)

    if args.list_devices:
        import sounddevice as sd

        print(sd.query_devices())
        return 0

    print("Phase 0 smoke test\n" + "-" * 60)
    results = []

    checks = [
        ("audio model", lambda: check_audio_model()),
        ("microphone", lambda: check_microphone(args.seconds, args.device)),
        ("live display", lambda: check_display()),
    ]
    if not args.skip_camera:
        checks += [
            ("webcam", lambda: check_webcam(args.camera)),
            ("person detector", lambda: check_person_detector()),
        ]

    for name, fn in checks:
        print(f"[..] {name} ...", flush=True)
        t0 = time.time()
        status, detail = fn()
        results.append((name, status))
        print(f"[{status}] {name}: {detail}  ({time.time() - t0:.1f}s)\n")

    print("-" * 60)
    for name, status in results:
        print(f"  {status:4s}  {name}")
    ok = all(s == PASS for _, s in results)
    print("-" * 60)
    print("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED - see details above")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
