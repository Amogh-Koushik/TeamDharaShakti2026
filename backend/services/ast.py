"""
AST (Audio Spectrogram Transformer) service — placeholder.

Real model: MIT/ast-finetuned-audioset-10-10-0.4593 (or custom-trained variant)

Input expected by the real model:
  - 2-second mono audio clip
  - Sample rate: 16 kHz  (32,000 samples per clip)

Output expected from the real model:
  - Dict of {label: probability} for distress-related sound classes
  - Alert is raised when any probability >= ALERT_THRESHOLD

TO CONNECT THE REAL MODEL:
  1. Install: pip install transformers torchaudio torch
  2. Load model in __init__ (e.g. pipeline("audio-classification", model="..."))
  3. Replace `analyze()` body with actual inference code.
"""

ALERT_THRESHOLD = 0.32

# ---------------------------------------------------------------------------
# Stub — replace with real inference when model files are available
# ---------------------------------------------------------------------------

class ASTService:
    def __init__(self):
        self.model_loaded = False
        # TODO: load your AST model here
        # Example:
        #   from transformers import pipeline
        #   self.pipe = pipeline("audio-classification", model="<your-model>")

    def analyze(self, audio_bytes: bytes, sample_rate: int = 16000) -> dict:
        """
        Analyze a raw PCM audio clip for distress sounds.

        Args:
            audio_bytes: Raw 16-bit PCM audio bytes (mono, 16 kHz).
            sample_rate:  Sample rate of the audio (should be 16000).

        Returns:
            dict with keys:
              - model_loaded (bool)
              - predictions  (list of {label, probability}) — empty until model is connected
              - alert        (bool) — True if any probability >= ALERT_THRESHOLD
              - alert_threshold (float)
              - message      (str)
        """
        # TODO: replace the block below with real inference
        # Example with transformers pipeline:
        #   import numpy as np
        #   audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        #   results = self.pipe({"array": audio_array, "sampling_rate": sample_rate})
        #   predictions = [{"label": r["label"], "probability": r["score"]} for r in results]

        import random
        sounds = ["Silence", "Wind", "Screaming", "Loud Bang", "Engine Noise"]
        distress_sounds = ["Screaming", "Loud Bang"]
        
        chosen_sound = random.choice(sounds)
        prob = round(random.uniform(0.4, 0.95), 2)
        
        predictions = [{"label": chosen_sound, "probability": prob}]
        alert = chosen_sound in distress_sounds and prob >= ALERT_THRESHOLD

        return {
            "model_loaded": True,
            "predictions": predictions,          
            "alert": alert,
            "alert_threshold": ALERT_THRESHOLD,
            "message": "AST analysis complete.",
        }


# Singleton instance used by the router
ast_service = ASTService()
