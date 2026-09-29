# TriNetra — Backend

FastAPI backend for the **TriNetra** AI-powered mine safety/rescue rover (SIH 2026 demo).

> **Note:** The actual ML model files are not included. The three ML service files are clearly marked stubs — connect your real models when they are ready.

---

## Quick Start

```bash
# 1. Go to the backend directory
cd backend

# 2. (Recommended) Create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check — returns `{"status": "ok"}` |
| `POST` | `/api/audio/analyze` | Send audio → AST sound classifier |
| `POST` | `/api/speech/recognize` | Send audio → Vosk keyword recognizer |
| `POST` | `/api/person/detect` | Send image → YOLOv8n person detector |

### Interactive API docs

Once the server is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Testing the Endpoints

### Health check
```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

### Audio analysis (AST)
```bash
curl -X POST http://localhost:8000/api/audio/analyze \
  -F "file=@your_audio.wav"
```
Expected input: mono WAV, 16 kHz, ~2 seconds

### Speech recognition (Vosk)
```bash
curl -X POST http://localhost:8000/api/speech/recognize \
  -F "file=@your_audio.wav"
```
Expected input: mono PCM, 16 kHz, 16-bit

### Person detection (YOLOv8n)
```bash
curl -X POST http://localhost:8000/api/person/detect \
  -F "file=@frame.jpg"
```
Expected input: JPEG/PNG, ideally 640×480

---

## Project Structure

```
backend/
├── main.py              # FastAPI app + all route definitions
├── requirements.txt     # Python dependencies
├── README.md            # This file
└── services/
    ├── ast.py           # AST sound classifier stub
    ├── vosk.py          # Vosk speech recognizer stub
    └── yolo.py          # YOLOv8n person detector stub
```

---

## Connecting Real ML Models

Each service file contains a clearly marked `# TODO` block and commented-out example code.

| Service | File | Install |
|---------|------|---------|
| AST | `services/ast.py` | `pip install transformers torchaudio torch` |
| Vosk | `services/vosk.py` | `pip install vosk` |
| YOLOv8n | `services/yolo.py` | `pip install ultralytics opencv-python-headless` |

---

## Architecture

```
Frontend (Next.js :3000)
        ↓
  FastAPI (:8000)
        ↓
  ML Service stub
        ↓
  AST / Vosk / YOLOv8n
        ↓
     Result
        ↓
  Frontend / Rover
```

---

## CORS

CORS is pre-configured to allow requests from `http://localhost:3000` (the Next.js frontend).
