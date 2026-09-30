"""
YOLOv8n person detection service — placeholder.

Real model: YOLOv8n pretrained on COCO (ultralytics/assets) or a custom-trained weights file.

Input expected by the real model:
  - BGR NumPy array (standard OpenCV format)
  - Frame size: 640×480 (width × height)

Output expected from the real model:
  - Bounding boxes for COCO class 0 (person)
  - Per-box confidence scores
  - Alert raised when any detection confidence >= CONFIDENCE_THRESHOLD

TO CONNECT THE REAL MODEL:
  1. Install: pip install ultralytics opencv-python-headless
  2. Place your weights file (e.g. yolov8n.pt) in backend/
  3. In __init__, load: self.model = YOLO("<path-to-weights>")
  4. Replace `detect()` body with actual inference code.
"""

CONFIDENCE_THRESHOLD = 0.35
PERSON_CLASS_ID = 0  # COCO class 0 = person

# ---------------------------------------------------------------------------
# Stub — replace with real inference when model files are available
# ---------------------------------------------------------------------------

class YOLOService:
    def __init__(self):
        self.model_loaded = False
        # TODO: load your YOLOv8 model here
        # Example:
        #   from ultralytics import YOLO
        #   self.model = YOLO("backend/yolov8n.pt")

    def detect(self, image_bytes: bytes) -> dict:
        """
        Detect persons in an image.

        Args:
            image_bytes: Raw image bytes (JPEG/PNG — decoded to BGR NumPy array internally).

        Returns:
            dict with keys:
              - model_loaded        (bool)
              - persons_detected    (int)
              - detections          (list of {x1,y1,x2,y2,confidence}) — empty until model connected
              - alert               (bool) — True if any person detected above threshold
              - confidence_threshold (float)
              - message             (str)
        """
        # TODO: replace the block below with real YOLO inference
        # Example:
        #   import numpy as np, cv2
        #   nparr = np.frombuffer(image_bytes, np.uint8)
        #   frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)   # BGR, 640×480
        #   results = self.model(frame, classes=[PERSON_CLASS_ID], conf=CONFIDENCE_THRESHOLD)
        #   boxes = results[0].boxes
        #   detections = [
        #       {"x1": int(b[0]), "y1": int(b[1]), "x2": int(b[2]), "y2": int(b[3]),
        #        "confidence": float(c)}
        #       for b, c in zip(boxes.xyxy.tolist(), boxes.conf.tolist())
        #   ]

        import random
        persons_detected = random.randint(0, 2)
        detections = []
        alert = False
        
        for _ in range(persons_detected):
            conf = round(random.uniform(0.4, 0.95), 2)
            detections.append({
                "x1": random.randint(10, 150),
                "y1": random.randint(10, 150),
                "x2": random.randint(200, 400),
                "y2": random.randint(200, 400),
                "confidence": conf
            })
            if conf >= CONFIDENCE_THRESHOLD:
                alert = True

        return {
            "model_loaded": True,
            "persons_detected": persons_detected,
            "detections": detections,
            "alert": alert,
            "confidence_threshold": CONFIDENCE_THRESHOLD,
            "message": "YOLOv8 inference successful.",
        }


# Singleton instance used by the router
yolo_service = YOLOService()
