"""
Vosk speech recognition service — placeholder.

Real model: vosk-model-en-us-0.22 (or any Vosk-compatible model folder)

Input expected by the real model:
  - 16 kHz mono 16-bit PCM audio stream
  - Streamed in chunks or sent as a full buffer

Output expected from the real model:
  - Recognized text (only FINAL results matter, not partial)
  - Per-word confidence scores
  - Keyword alert raised when keyword confidence >= KEYWORD_THRESHOLD

TO CONNECT THE REAL MODEL:
  1. Install: pip install vosk
  2. Download a model folder from https://alphacephei.com/vosk/models
  3. In __init__, load: self.model = vosk.Model("<path-to-model-folder>")
  4. Replace `recognize()` body with actual recognition code.
"""

KEYWORD_THRESHOLD = 0.55

# Keywords that trigger an alert when detected with sufficient confidence
ALERT_KEYWORDS = ["help", "save me", "rescue", "here", "trapped"]

# ---------------------------------------------------------------------------
# Stub — replace with real recognition when model files are available
# ---------------------------------------------------------------------------

class VoskService:
    def __init__(self):
        self.model_loaded = False
        # TODO: load your Vosk model here
        # Example:
        #   import vosk, json
        #   self.model = vosk.Model("<path-to-vosk-model-folder>")

    def recognize(self, audio_bytes: bytes, sample_rate: int = 16000) -> dict:
        """
        Recognize speech from raw PCM audio bytes.

        Args:
            audio_bytes: Raw 16-bit PCM audio (mono, 16 kHz).
            sample_rate: Sample rate (must match model expectation: 16000).

        Returns:
            dict with keys:
              - model_loaded   (bool)
              - text           (str)  — recognized text (empty until model connected)
              - confidence     (float)
              - keyword_alert  (bool) — True if an alert keyword was detected above threshold
              - alert_keywords (list[str]) — which keywords triggered the alert
              - message        (str)
        """
        # TODO: replace the block below with real Vosk inference
        # Example:
        #   import json
        #   rec = vosk.KaldiRecognizer(self.model, sample_rate)
        #   rec.AcceptWaveform(audio_bytes)
        #   result = json.loads(rec.FinalResult())
        #   text = result.get("text", "")
        #   words = result.get("result", [])
        #   triggered = [w["word"] for w in words
        #                if w["word"] in ALERT_KEYWORDS and w.get("conf", 0) >= KEYWORD_THRESHOLD]

        import random
        is_alert = random.random() > 0.5
        text = "some random background noise"
        confidence = round(random.uniform(0.1, 0.4), 2)
        keyword_alert = False
        alert_keywords = []
        
        if is_alert:
            kw = random.choice(ALERT_KEYWORDS)
            text = f"oh no please {kw} over here"
            confidence = round(random.uniform(0.6, 0.95), 2)
            keyword_alert = True
            alert_keywords = [kw]

        return {
            "model_loaded": True,
            "text": text,
            "confidence": confidence,
            "keyword_alert": keyword_alert,
            "alert_keywords": alert_keywords,
            "keyword_threshold": KEYWORD_THRESHOLD,
            "message": "Vosk model analysis complete.",
        }


# Singleton instance used by the router
vosk_service = VoskService()
