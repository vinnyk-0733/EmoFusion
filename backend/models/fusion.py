# Emotion Processing Module (Dual-Input Architecture)
# Analyzes distinct signals from FER (Face) and TER (Text) to derive Mental State
# No mathematical fusion - preserves context of both modalities.

from typing import Dict, Optional, Tuple, Any
import logging

from config import EMOTION_LABELS

logger = logging.getLogger(__name__)

# Mental State Matrix for Cross-Modality Analysis
# Format: (FER_Label, TER_Label) -> Mental_State_Description
# This handles "Incongruence" (e.g., masking pain) and "Congruence" (genuine emotion)
MENTAL_STATE_MATRIX = {
    # --- CONGRUENT STATES (Genuine) ---
    ("happy", "happy"): "Genuine Happiness / Positive Mood",
    ("sad", "sad"): "Deep Sadness / Grief",
    ("angry", "angry"): "Genuine Anger / Frustration",
    ("fear", "fear"): "Genuine Fear / Anxiety",
    ("surprise", "surprise"): "Genuine Surprise / Shock",
    ("neutral", "neutral"): "Calm / Stable / Neutral",

    # --- HAPPY FACE MASKS ---
    ("happy", "sad"): "Masking Pain (Hiding sadness behind a smile)",
    ("happy", "angry"): "Passive Aggressive / Hiding Frustration",
    ("happy", "fear"): "Nervous Laughter / Masking Anxiety",
    ("happy", "neutral"): "Polite / Socially Amenable",

    # --- SAD FACE CONTEXTS ---
    ("sad", "happy"): "Trying to cope / Forcing Positivity",
    ("sad", "angry"): "Hurt & Frustrated (Sadness driving Anger)",
    ("sad", "fear"): "Overwhelmed / Despair",
    ("sad", "neutral"): "Low Energy / Melancholic",

    # --- ANGRY FACE CONTEXTS ---
    ("angry", "happy"): "Sarcastic / Mocking",
    ("angry", "sad"): "Frustrated & Hurt",
    ("angry", "fear"): "Defensive / Threatened",
    ("angry", "neutral"): "Stern / Serious / Suppressed Anger",

    # --- FEAR FACE CONTEXTS ---
    ("fear", "happy"): "Relieved / Hysterical",
    ("fear", "sad"): "Hopeless / Terrified",
    ("fear", "angry"): "Panic / Fight-or-Flight",
    ("fear", "neutral"): "Anxious / On Edge",
    
    # --- NEUTRAL FACE CONTEXTS ---
    ("neutral", "happy"): "Mildly Pleased / Content",
    ("neutral", "sad"): "Internalized Sadness / Stoic",
    ("neutral", "angry"): "Cold Anger / Annoyed",
    ("neutral", "fear"): "Internal Anxiety / Worry",
    ("neutral", "surprise"): "Mildly Surprised / Curious",
    
    # --- SURPRISE FACE CONTEXTS ---
    ("surprise", "happy"): "Excited / Joyful Surprise",
    ("surprise", "sad"): "Shocking Bad News / Disbelief",
    ("surprise", "angry"): "Outraged / Shocked",
    ("surprise", "fear"): "Startled / Scared",
}

def derive_mental_state(fer_emotion: Optional[str], ter_emotion: Optional[str]) -> str:
    """
    Derive complex mental state from the combination of Face and Text emotions.
    """
    # 1. No Data
    if not fer_emotion and not ter_emotion:
        return "Unknown / Waiting for input"
        
    # 2. Only Text (Camera Off/No Face)
    if not fer_emotion and ter_emotion:
        # Fallback to simple mapping
        simple_map = {
            "happy": "Positive Mood", "sad": "Low Mood", "angry": "Frustrated",
            "fear": "Anxious", "surprise": "Surprised", "neutral": "Neutral"
        }
        return simple_map.get(ter_emotion, "Stable")

    # 3. Only Face (No Text / Silent)
    if fer_emotion and not ter_emotion:
        simple_map = {
            "happy": "Appears Happy", "sad": "Appears Sad", "angry": "Appears Angry",
            "fear": "Appears Anxious", "surprise": "Appears Surprised", "neutral": "Appears Neutral"
        }
        return simple_map.get(fer_emotion, "Observing")

    # 4. Dual Input Available - Use Matrix
    # Normalize inputs just in case
    key = (fer_emotion, ter_emotion)
    
    # Matrix Lookup
    if key in MENTAL_STATE_MATRIX:
        return MENTAL_STATE_MATRIX[key]
        
    # Fallback for undefined combinations
    return f"Mixed State ({fer_emotion} face, {ter_emotion} words)"

def process_emotions(
    fer_probs: Optional[Dict[str, float]],
    ter_probs: Optional[Dict[str, float]]
) -> Dict[str, Any]:
    """
    Process distinct emotion signals without mathematical fusion.
    """
    # 1. Extract Dominant Labels
    fer_emotion = None
    fer_score = 0.0
    if fer_probs:
        fer_emotion, fer_score = max(fer_probs.items(), key=lambda x: x[1])
        
    ter_emotion = None
    ter_score = 0.0
    if ter_probs:
        ter_emotion, ter_score = max(ter_probs.items(), key=lambda x: x[1])

    # 2. Derive Mental State
    mental_state = derive_mental_state(fer_emotion, ter_emotion)
    
    # 3. Determine "Display Emotion" (For UI Badge)
    # Priority: FER (if active) > TER (if active) > Neutral
    final_emotion = fer_emotion if fer_emotion else (ter_emotion if ter_emotion else "neutral")
    
    # 4. Calculate a "Confidence" metric (just for UI display, helps visualize strength)
    confidence = fer_score if fer_emotion else (ter_score if ter_emotion else 0.0)
    
    return {
        "fer_emotion": fer_emotion,
        "fer_score": fer_score,
        "ter_emotion": ter_emotion,
        "ter_score": ter_score,
        "final_emotion": final_emotion, # For UI Badge
        "mental_state": mental_state,
        "fer_available": fer_probs is not None,
        "ter_available": ter_probs is not None,
        "fused_scores": fer_probs if fer_probs else (ter_probs if ter_probs else {}) # fallback for UI charts
    }
