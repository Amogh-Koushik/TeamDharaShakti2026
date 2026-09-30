"""
Phase 2 - Survivor Detection on a Simulated Thermal Feed
AI Analysis Engine, Underground Mine Rescue Rover

Takes the laptop webcam, recolours it to look like a thermal camera, and runs a
pretrained person detector on top. Any person in frame gets a bounding box and a
"POSSIBLE SURVIVOR" label, and a banner flips to an alert state.

This is openly a STAND-IN for the rover's real FLIR thermal camera, which is not
built yet - the on-screen caption says so at all times. The detection logic
underneath is real and is what runs once the sensor is wired in.

Run it:
    python -m phase2_survivor_detection.survivor_detector

Keys (while the window is focused):
    q / Esc   quit
    f         toggle fullscreen
    c         cycle the thermal colour map
    p         pause / resume the feed
    h         show / hide the HUD (fps, latency)

Flags:
    --camera N       use webcam index N
    --fullscreen     start full screen
    --no-detect      show the thermal feed only, no detector (camera debugging)
    --check          grab one frame, print its size, exit (no window)

All tuning lives in phase2_survivor_detection/config.py
"""

from __future__ import annotations

import argparse
import sys
import threading
import time
from collections import deque

import cv2
import numpy as np

from . import config as C


# --------------------------------------------------------------------------
# Camera
# --------------------------------------------------------------------------
class Camera:
    """Webcam wrapper that reopens itself if the device drops out."""

    def __init__(self, index: int, width: int, height: int):
        self.index = index
        self.width = width
        self.height = height
        self.cap: cv2.VideoCapture | None = None
        self.ok = False
        self._last_open_attempt = 0.0
        self.open()

    def open(self) -> None:
        self._last_open_attempt = time.monotonic()
        for backend in (cv2.CAP_DSHOW, cv2.CAP_ANY):
            cap = cv2.VideoCapture(self.index, backend)
            if cap.isOpened():
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                self.cap = cap
                self.ok = True
                return
            cap.release()
        self.ok = False

    def read(self) -> np.ndarray | None:
        if not self.ok or self.cap is None:
            if time.monotonic() - self._last_open_attempt > 1.5:
                self.release()
                self.open()
            return None
        got, frame = self.cap.read()
        if not got or frame is None:
            self.ok = False
            return None
        return frame

    def release(self) -> None:
        if self.cap is not None:
            self.cap.release()
        self.cap = None
        self.ok = False


# --------------------------------------------------------------------------
# Thermal-style recolour (cosmetic only)
# --------------------------------------------------------------------------
class ThermalRecolor:
    def __init__(self):
        self._clahe = cv2.createCLAHE(clipLimit=C.CLAHE_CLIP, tileGridSize=(8, 8))
        self.colormap_names = list(C.COLORMAPS)
        self._idx = 0

    @property
    def current_name(self) -> str:
        return self.colormap_names[self._idx]

    def cycle(self) -> None:
        self._idx = (self._idx + 1) % len(self.colormap_names)

    def apply(self, frame_bgr: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        if C.USE_CLAHE:
            gray = self._clahe.apply(gray)
        if C.THERMAL_BLUR and C.THERMAL_BLUR >= 3:
            k = C.THERMAL_BLUR | 1
            gray = cv2.GaussianBlur(gray, (k, k), 0)
        cmap = getattr(cv2, f"COLORMAP_{self.current_name}", cv2.COLORMAP_INFERNO)
        return cv2.applyColorMap(gray, cmap)


# --------------------------------------------------------------------------
# Detection worker
# --------------------------------------------------------------------------
class DetectionWorker(threading.Thread):
    """Runs the person detector on the most recent frame, off the display thread
    so the video never stutters while YOLO is thinking."""

    def __init__(self):
        super().__init__(daemon=True)
        self._stop = threading.Event()
        self._lock = threading.Lock()
        self._frame: np.ndarray | None = None
        self._frame_id = 0
        self._seen_id = -1

        self.boxes: list[tuple[int, int, int, int, float]] = []
        self.updated_at = 0.0
        self.infer_ms = 0.0
        self.error: str | None = None
        self.ready = False

    def submit(self, frame: np.ndarray) -> None:
        with self._lock:
            self._frame = frame
            self._frame_id += 1

    def stop(self) -> None:
        self._stop.set()

    def run(self) -> None:
        try:
            from shared.person_detector import PersonDetector

            det = PersonDetector(model_path=C.MODEL_PATH, conf=C.CONF_THRESHOLD,
                                 imgsz=C.DETECT_IMGSZ)
            self.ready = True
        except Exception as exc:  # noqa: BLE001
            self.error = f"detector load failed: {exc}"
            return

        while not self._stop.is_set():
            with self._lock:
                frame = self._frame
                fid = self._frame_id
            if frame is None or fid == self._seen_id:
                time.sleep(0.005)
                continue
            self._seen_id = fid
            t0 = time.perf_counter()
            try:
                boxes = det.detect(frame)
            except Exception as exc:  # keep the loop alive on a bad frame
                print(f"[phase2] detect error: {exc}", flush=True)
                continue
            self.infer_ms = (time.perf_counter() - t0) * 1000.0
            self.boxes = boxes
            self.updated_at = time.monotonic()


# --------------------------------------------------------------------------
# Overlays
# --------------------------------------------------------------------------
FONT = cv2.FONT_HERSHEY_SIMPLEX
WHITE = (255, 255, 255)
GREEN = (120, 255, 120)
RED = (60, 60, 255)          # BGR
CYAN = (255, 255, 80)
BLACK = (0, 0, 0)


def _text(img, s, org, scale, color, thick=2, shadow=True):
    if shadow:
        cv2.putText(img, s, (org[0] + 1, org[1] + 1), FONT, scale, BLACK, thick, cv2.LINE_AA)
    cv2.putText(img, s, org, FONT, scale, color, thick, cv2.LINE_AA)


def _fit_scale(text, target_w, base_scale, thick, min_scale=0.35):
    """Shrink base_scale until `text` fits inside target_w pixels."""
    scale = base_scale
    while scale > min_scale:
        (tw, _), _ = cv2.getTextSize(text, FONT, scale, thick)
        if tw <= target_w:
            break
        scale *= 0.92
    return scale


def draw_banner(img, text, alert: bool):
    h, w = img.shape[:2]
    strip_h = min(max(38, h // 12), 64)
    color = RED if alert else (40, 40, 40)
    cv2.rectangle(img, (0, 0), (w, strip_h), color, -1)
    scale = _fit_scale(text, int(w * 0.94), strip_h / 42.0, 2)
    (tw, th), _ = cv2.getTextSize(text, FONT, scale, 2)
    _text(img, text, ((w - tw) // 2, (strip_h + th) // 2),
          scale, WHITE if alert else GREEN, 2, shadow=False)


def draw_caption(img, text):
    h, w = img.shape[:2]
    strip_h = min(max(26, h // 16), 44)
    y0 = h - strip_h
    overlay = img.copy()
    cv2.rectangle(overlay, (0, y0), (w, h), BLACK, -1)
    cv2.addWeighted(overlay, 0.55, img, 0.45, 0, img)
    scale = _fit_scale(text, int(w * 0.97), 0.5, 1)
    (_, th), _ = cv2.getTextSize(text, FONT, scale, 1)
    _text(img, text, (10, y0 + (strip_h + th) // 2), scale, WHITE, 1, shadow=False)


def draw_box(img, box):
    h, w = img.shape[:2]
    x1, y1, x2, y2, conf = box
    cv2.rectangle(img, (x1, y1), (x2, y2), CYAN, 2, cv2.LINE_AA)
    label = f"{C.SURVIVOR_LABEL}  {conf * 100:.0f}%"
    scale = 0.55
    (tw, th), bl = cv2.getTextSize(label, FONT, scale, 2)
    lx = min(max(0, x1), w - tw - 8)          # keep the label inside the frame
    ly = max(y1, th + 8)
    cv2.rectangle(img, (lx, ly - th - 8), (lx + tw + 8, ly + bl - 2), CYAN, -1)
    cv2.putText(img, label, (lx + 4, ly - 3), FONT, scale, BLACK, 2, cv2.LINE_AA)


def draw_hud(img, lines):
    y = img.shape[0] // 12 + 24
    for ln in lines:
        _text(img, ln, (12, y), 0.5, WHITE, 1)
        y += 20


# --------------------------------------------------------------------------
# App
# --------------------------------------------------------------------------
def run(args) -> int:
    recolor = ThermalRecolor()

    worker = None
    if not args.no_detect:
        worker = DetectionWorker()
        worker.start()

    cam = Camera(args.camera, C.FRAME_WIDTH, C.FRAME_HEIGHT)
    if not cam.ok:
        print(f"[phase2] WARNING: could not open camera {args.camera}. "
              f"Will keep retrying. Try --camera 1 / 2.", file=sys.stderr)

    fullscreen = bool(args.fullscreen or C.START_FULLSCREEN)
    show_hud = C.SHOW_HUD
    paused = False

    cv2.namedWindow(C.WINDOW_NAME, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(C.WINDOW_NAME, 1024, 768)
    _apply_fullscreen(fullscreen)

    frame_times = deque(maxlen=30)
    last_frame = None
    print("[phase2] running - step into frame to trigger detection. Keys: q quit, "
          "f fullscreen, c colourmap, p pause, h HUD.", flush=True)

    while True:
        if not paused:
            grabbed = cam.read()
            if grabbed is not None:
                last_frame = grabbed
                if worker is not None:
                    worker.submit(grabbed)

        now = time.monotonic()
        frame_times.append(now)
        fps = 0.0
        if len(frame_times) >= 2:
            fps = (len(frame_times) - 1) / max(1e-6, frame_times[-1] - frame_times[0])

        # ---- build the display frame ----
        if last_frame is None:
            disp = np.zeros((C.FRAME_HEIGHT, C.FRAME_WIDTH, 3), np.uint8)
            _text(disp, "CAMERA SIGNAL LOST - reconnecting...",
                  (30, C.FRAME_HEIGHT // 2), 0.7, WHITE, 2)
        else:
            disp = recolor.apply(last_frame)

        boxes, fresh, infer_ms, det_err = [], False, 0.0, None
        if worker is not None:
            det_err = worker.error
            if det_err is None:
                infer_ms = worker.infer_ms
                if now - worker.updated_at < 0.6:      # only trust recent results
                    boxes = worker.boxes
                    fresh = True

        alert = bool(boxes)
        for b in boxes:
            draw_box(disp, b)

        if det_err:
            draw_banner(disp, "DETECTOR ERROR - SEE CONSOLE", alert=True)
        elif args.no_detect:
            draw_banner(disp, "THERMAL FEED ONLY (detector off)", alert=False)
        elif worker is not None and not worker.ready:
            draw_banner(disp, "LOADING DETECTOR...", alert=False)
        elif alert:
            n = len(boxes)
            draw_banner(disp, f"{C.ALERT_TEXT}" + (f"  x{n}" if n > 1 else ""), alert=True)
        else:
            draw_banner(disp, C.IDLE_TEXT, alert=False)

        draw_caption(disp, C.SIM_CAPTION)

        if show_hud:
            draw_hud(disp, [
                f"display {fps:4.1f} fps   detector {infer_ms:5.1f} ms"
                + ("" if fresh or args.no_detect else "   (waiting)"),
                f"colourmap: {recolor.current_name}   cam {C.FRAME_WIDTH}x{C.FRAME_HEIGHT}"
                + ("   PAUSED" if paused else ""),
                "q quit  f fullscreen  c colourmap  p pause  h HUD",
            ])

        cv2.imshow(C.WINDOW_NAME, disp)

        # ---- keys ----
        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), 27):
            break
        elif key == ord("f"):
            fullscreen = not fullscreen
            _apply_fullscreen(fullscreen)
        elif key == ord("c"):
            recolor.cycle()
        elif key == ord("p"):
            paused = not paused
        elif key == ord("h"):
            show_hud = not show_hud

        if cv2.getWindowProperty(C.WINDOW_NAME, cv2.WND_PROP_VISIBLE) < 1:
            break

    if worker is not None:
        worker.stop()
    cam.release()
    cv2.destroyAllWindows()
    return 0


def _apply_fullscreen(on: bool) -> None:
    cv2.setWindowProperty(
        C.WINDOW_NAME, cv2.WND_PROP_FULLSCREEN,
        cv2.WINDOW_FULLSCREEN if on else cv2.WINDOW_NORMAL,
    )


def _check(camera: int) -> int:
    cam = Camera(camera, C.FRAME_WIDTH, C.FRAME_HEIGHT)
    if not cam.ok:
        print(f"[check] FAIL: camera {camera} did not open")
        return 1
    frame = None
    for _ in range(10):
        frame = cam.read()
        if frame is not None:
            break
        time.sleep(0.1)
    cam.release()
    if frame is None:
        print(f"[check] FAIL: camera {camera} opened but returned no frame")
        return 1
    print(f"[check] PASS: camera {camera} -> frame {frame.shape[1]}x{frame.shape[0]}")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Phase 2 - survivor detection (simulated thermal)")
    ap.add_argument("--camera", type=int, default=C.CAM_INDEX, help="webcam index")
    ap.add_argument("--fullscreen", action="store_true")
    ap.add_argument("--no-detect", action="store_true", help="thermal feed only, no detector")
    ap.add_argument("--check", action="store_true", help="grab one frame, print size, exit")
    args = ap.parse_args(argv)

    if args.check:
        return _check(args.camera)
    return run(args)


if __name__ == "__main__":
    raise SystemExit(main())
