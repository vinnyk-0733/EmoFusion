"""
Emotion Processing & Dual-Input Mental State Matrix
Derives mental states from multimodal inputs (FER and TER) without destructive mathematical loss.
"""

import logging
from typing import Dict, Optional, Any
from app.modules.emotion.schemas import MultimodalEmotionResult

logger = logging.getLogger(__name__)

# Mental State Matrix for Cross-Modality Analysis
MENTAL_STATE_MATRIX = {
    # Congruent Genuine States
    ("happy", "happy"): "Genuine Happiness / Positive Mood",
    ("sad", "sad"): "Deep Sadness / Grief",
    ("angry", "angry"): "Genuine Anger / Frustration",
    ("fear", "fear"): "Genuine Fear / Anxiety",
    ("surprise", "surprise"): "Genuine Surprise / Shock",
    ("neutral", "neutral"): "Calm / Stable / Neutral",

    # Happy Face Masks
    ("happy", "sad"): "Masking Pain (Hiding sadness behind a smile)",
    ("happy", "angry"): "Passive Aggressive / Hiding Frustration",
    ("happy", "fear"): "Nervous Laughter / Masking Anxiety",
    ("happy", "neutral"): "Polite / Socially Amenable",

    # Sad Face Contexts
    ("sad", "happy"): "Trying to cope / Forcing Positivity",
    ("sad", "angry"): "Hurt & Frustrated (Sadness driving Anger)",
    ("sad", "fear"): "Overwhelmed / Despair",
    ("sad", "neutral"): "Low Energy / Melancholic",

    # Angry Face Contexts
    ("angry", "happy"): "Sarcastic / Mocking",
    ("angry", "sad"): "Frustrated & Hurt",
    ("angry", "fear"): "Defensive / Threatened",
    ("angry", "neutral"): "Stern / Serious / Suppressed Anger",

    # Fear Face Contexts
    ("fear", "happy"): "Relieved / Hysterical",
    ("fear", "sad"): "Hopeless / Terrified",
    ("fear", "angry"): "Panic / Fight-or-Flight",
    ("fear", "neutral"): "Anxious / On Edge",

    # Neutral Face Contexts
    ("neutral", "happy"): "Mildly Pleased / Content",
    ("neutral", "sad"): "Internalized Sadness / Stoic",
    ("neutral", "angry"): "Cold Anger / Annoyed",
    ("neutral", "fear"): "Internal Anxiety / Worry",
    ("neutral", "surprise"): "Mildly Surprised / Curious",

    # Surprise Face Contexts
    ("surprise", "happy"): "Excited / Joyful Surprise",
    ("surprise", "sad"): "Shocking Bad News / Disbelief",
    ("surprise", "angry"): "Outraged / Shocked",
    ("surprise", "fear"): "Startled / Scared",
}


def derive_mental_state(fer_emotion: Optional[str], ter_emotion: Optional[str]) -> str:
    """Derive mental state from combination of facial expression and text tone."""
    if not fer_emotion and not ter_emotion:
        return "Unknown / Waiting for input"

    if not fer_emotion and ter_emotion:
        simple_map = {
            "happy": "Positive Mood", "sad": "Low Mood", "angry": "Frustrated",
            "fear": "Anxious", "surprise": "Surprised", "neutral": "Neutral"
        }
        return simple_map.get(ter_emotion, "Stable")

    if fer_emotion and not ter_emotion:
        simple_map = {
            "happy": "Appears Happy", "sad": "Appears Sad", "angry": "Appears Angry",
            "fear": "Appears Anxious", "surprise": "Appears Surprised", "neutral": "Appears Neutral"
        }
        return simple_map.get(fer_emotion, "Observing")

    key = (fer_emotion, ter_emotion)
    if key in MENTAL_STATE_MATRIX:
        return MENTAL_STATE_MATRIX[key]

    return f"Mixed State ({fer_emotion} face, {ter_emotion} words)"


def process_emotions(
    fer_probs: Optional[Dict[str, float]],
    ter_probs: Optional[Dict[str, float]]
) -> Dict[str, Any]:
    """Process facial and textual emotion probabilities into a unified context payload."""
    fer_emotion = None
    fer_score = 0.0
    if fer_probs:
        fer_emotion, fer_score = max(fer_probs.items(), key=lambda x: x[1])

    ter_emotion = None
    ter_score = 0.0
    if ter_probs:
        ter_emotion, ter_score = max(ter_probs.items(), key=lambda x: x[1])

    mental_state = derive_mental_state(fer_emotion, ter_emotion)

    # Priority: FER (if active) > TER (if active) > Neutral
    final_emotion = fer_emotion if fer_emotion else (ter_emotion if ter_emotion else "neutral")

    return {
        "fer_emotion": fer_emotion,
        "fer_score": fer_score,
        "ter_emotion": ter_emotion,
        "ter_score": ter_score,
        "final_emotion": final_emotion,
        "mental_state": mental_state,
        "fer_available": fer_probs is not None,
        "ter_available": ter_probs is not None,
        "fused_scores": fer_probs if fer_probs else (ter_probs if ter_probs else {})
    }

