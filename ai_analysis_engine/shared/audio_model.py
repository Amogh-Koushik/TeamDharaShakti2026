"""
Pretrained audio-event classifier for the AI Analysis Engine.

Model:  MIT/ast-finetuned-audioset-10-10-0.4593
        Audio Spectrogram Transformer, fine-tuned on Google's AudioSet.
        527 real-world sound classes (speech, shouting, screaming, crying,
        alarms, machinery, ...). No training required — it downloads ready to
        use from the Hugging Face model hub (~350 MB, once).

Usage:
    clf = AudioEventClassifier()          # loads once, keep the instance
    ranked = clf.classify(waveform, sr)   # -> [(label, prob), ...] high -> low

The waveform is any 1-D float array roughly in [-1, 1]; it is resampled to
16 kHz mono internally, which is what the model expects.
"""

from __future__ import annotations

from math import gcd

import numpy as np

MODEL_ID = "MIT/ast-finetuned-audioset-10-10-0.4593"
TARGET_SR = 16_000


def _resample(wav: np.ndarray, src_sr: int, dst_sr: int) -> np.ndarray:
    """Polyphase resample to the model's sample rate."""
    if src_sr == dst_sr:
        return wav.astype(np.float32, copy=False)
    from scipy.signal import resample_poly

    g = gcd(int(src_sr), int(dst_sr))
    return resample_poly(wav, dst_sr // g, src_sr // g).astype(np.float32)


class AudioEventClassifier:
    """Thin wrapper around the AST AudioSet model. Load once, call classify()."""

    def __init__(self, model_id: str = MODEL_ID, verbose: bool = True):
        # Imported lazily so `--help` and argument errors don't pay the
        # multi-second torch import cost.
        import torch
        from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

        self._torch = torch
        if verbose:
            print(
                f"[audio_model] loading '{model_id}' "
                f"(first run downloads ~350 MB, then it is cached)...",
                flush=True,
            )
        self.feature_extractor = AutoFeatureExtractor.from_pretrained(model_id)
        self.model = AutoModelForAudioClassification.from_pretrained(model_id)
        self.model.eval()
        torch.set_grad_enabled(False)

        self.id2label: dict[int, str] = dict(self.model.config.id2label)
        self.num_classes = len(self.id2label)
        if verbose:
            print(
                f"[audio_model] model loaded, {self.num_classes} classes available",
                flush=True,
            )

    @property
    def labels(self) -> list[str]:
        return [self.id2label[i] for i in range(self.num_classes)]

    def classify(self, waveform: np.ndarray, sample_rate: int) -> list[tuple[str, float]]:
        """Return every class as (label, probability), ranked high -> low.

        AudioSet is multi-label, so probabilities are independent sigmoids and
        do NOT sum to 1 — a clear scream can read ~0.7 on its own.
        """
        wav = np.asarray(waveform, dtype=np.float32).reshape(-1)
        if wav.size == 0:
            return []

        wav = _resample(wav, sample_rate, TARGET_SR)

        # Never let a dead / glitching mic take the whole script down.
        if not np.isfinite(wav).all():
            wav = np.nan_to_num(wav, nan=0.0, posinf=0.0, neginf=0.0)

        inputs = self.feature_extractor(
            wav, sampling_rate=TARGET_SR, return_tensors="pt"
        )
        logits = self.model(**inputs).logits[0]
        probs = self._torch.sigmoid(logits).cpu().numpy()

        order = np.argsort(probs)[::-1]
        return [(self.id2label[int(i)], float(probs[int(i)])) for i in order]


if __name__ == "__main__":
    # Minimal self-check: load the model and classify 2 s of white noise.
    clf = AudioEventClassifier()
    rng = np.random.default_rng(0)
    noise = rng.standard_normal(TARGET_SR * 2).astype(np.float32) * 0.2
    top = clf.classify(noise, TARGET_SR)[:5]
    print("top-5 on white noise:")
    for name, p in top:
        print(f"  {p:6.3f}  {name}")
