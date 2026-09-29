"""
TriNetra — FastAPI backend (SIH demo)

Architecture:
  Frontend / Rover  →  FastAPI  →  ML service stub  →  AST / Vosk / YOLOv8n  →  Result  →  Frontend

Endpoints:
  GET  /health                → liveness check
  POST /api/audio/analyze     → AST sound classifier
  POST /api/speech/recognize  → Vosk keyword recognizer
  POST /api/person/detect     → YOLOv8n person detector
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from services.ast  import ast_service
from services.vosk import vosk_service
from services.yolo import yolo_service

# ── App setup ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="TriNetra Backend",
    description="AI-powered mine safety/rescue rover — SIH 2026 demo backend",
    version="1.0.0",
)

# Allow the Next.js frontend (localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health():
    """Simple liveness check."""
    return {"status": "ok"}


@app.post("/api/audio/analyze", tags=["Audio"])
async def analyze_audio(file: UploadFile = File(...)):
    """
    Accepts a raw audio file and passes it to the AST classifier.

    Expected input:
      - Content-Type: audio/wav  (or any file upload)
      - Mono, 16 kHz, 16-bit PCM
      - ~2 seconds (32,000 samples)

    The AST service returns distress sound labels with probabilities.
    Alert threshold: 0.32
    """
    if not file.content_type or not file.content_type.startswith("audio"):
        # Also accept application/octet-stream for raw PCM uploads
        if file.content_type not in ("application/octet-stream", None):
            raise HTTPException(
                status_code=415,
                detail=f"Expected audio file, got {file.content_type}",
            )

    audio_bytes = await file.read()
    result = ast_service.analyze(audio_bytes)
    return result


@app.post("/api/speech/recognize", tags=["Speech"])
async def recognize_speech(file: UploadFile = File(...)):
    """
    Accepts a raw audio file and passes it to the Vosk keyword recognizer.

    Expected input:
      - Mono, 16 kHz, 16-bit PCM audio
      - Only FINAL results are used (not partial)

    The service returns recognized text + confidence.
    Keyword alert threshold: 0.55
    """
    audio_bytes = await file.read()
    result = vosk_service.recognize(audio_bytes)
    return result


@app.post("/api/person/detect", tags=["Vision"])
async def detect_person(file: UploadFile = File(...)):
    """
    Accepts a camera image and passes it to YOLOv8n for person detection.

    Expected input:
      - JPEG or PNG image
      - BGR 640×480 camera frame (standard OpenCV format)

    The service returns person bounding boxes + confidence.
    Confidence threshold: 0.35  (COCO class 0 — person)
    """
    if file.content_type and not file.content_type.startswith("image"):
        raise HTTPException(
            status_code=415,
            detail=f"Expected an image file, got {file.content_type}",
        )

    image_bytes = await file.read()
    result = yolo_service.detect(image_bytes)
    return result
