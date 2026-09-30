"""
Pretrained person detector for the AI Analysis Engine (Phase 2).

Model:  Ultralytics YOLO (yolov8n by default) — pretrained on the COCO dataset.
        "person" is class 0. Nano model, runs in real time on a laptop CPU.
        The weights file (~6 MB) downloads automatically on first use and is
        then cached next to wherever it was downloaded.

Usage:
    det = PersonDetector()                 # loads once, keep the instance
    boxes = det.detect(frame_bgr)          # -> [(x1, y1, x2, y2, conf), ...]
"""

from __future__ import annotations

import numpy as np

PERSON_CLASS_ID = 0  # COCO class index for "person"


class PersonDetector:
    def __init__(self, model_path: str = "yolov8n.pt", conf: float = 0.35,
                 imgsz: int = 480, verbose: bool = True):
        from ultralytics import YOLO

        if verbose:
            print(f"[person_detector] loading '{model_path}' "
                  f"(first run downloads the weights, then cached)...", flush=True)
        self.model = YOLO(model_path)
        self.conf = conf
        self.imgsz = imgsz
        if verbose:
            names = self.model.names
            print(f"[person_detector] model loaded, {len(names)} COCO classes, "
                  f"detecting only '{names[PERSON_CLASS_ID]}'", flush=True)

    def detect(self, frame_bgr: np.ndarray) -> list[tuple[int, int, int, int, float]]:
        """Return person bounding boxes in the frame as (x1, y1, x2, y2, conf)."""
        results = self.model.predict(
            frame_bgr,
            classes=[PERSON_CLASS_ID],
            conf=self.conf,
            imgsz=self.imgsz,
            verbose=False,
        )
        out: list[tuple[int, int, int, int, float]] = []
        if not results:
            return out
        boxes = results[0].boxes
        if boxes is None:
            return out
        for b in boxes:
            x1, y1, x2, y2 = (int(v) for v in b.xyxy[0].tolist())
            out.append((x1, y1, x2, y2, float(b.conf[0])))
        return out


if __name__ == "__main__":
    # Self-check: load model, run on a blank frame (expect zero detections).
    det = PersonDetector()
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    found = det.detect(blank)
    print(f"ran on a blank 640x480 frame, found {len(found)} people (expected 0)")
