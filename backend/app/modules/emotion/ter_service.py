"""
Text Emotion Recognition (TER) Service
Uses DistilBERT sequence classification and heuristic keyword boosting.
"""

import logging
from typing import Dict, Optional, Tuple, List
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

_tokenizer = None
_ter_model = None
_is_tf = False


def load_ter_model(model_path: Optional[str] = None):
    """Load and cache the DistilBERT TER model and tokenizer."""
    global _tokenizer, _ter_model, _is_tf
    if model_path is None:
        model_path = settings.TER_MODEL_PATH

    if _ter_model is None or _tokenizer is None:
        try:
            import os
            from transformers import AutoTokenizer, AutoConfig

            logger.info(f"Loading TER model from {model_path}")
            _tokenizer = AutoTokenizer.from_pretrained(model_path)

            ter_h5 = os.path.join(model_path, "ter_model.h5") if os.path.isdir(model_path) else None

            if ter_h5 and os.path.exists(ter_h5):
                # Load local TensorFlow weights directly from ter_model.h5
                import tensorflow as tf
                from transformers import TFAutoModelForSequenceClassification

                config = AutoConfig.from_pretrained(model_path)
                model = TFAutoModelForSequenceClassification.from_config(config)

                dummy_input = {'input_ids': tf.constant([[101, 102]], dtype=tf.int32)}
                _ = model(dummy_input)
                model.load_weights(ter_h5)

                _ter_model = model
                _is_tf = True
                logger.info(f"Loaded TensorFlow TER model from {ter_h5}")
            else:
                from transformers import AutoModelForSequenceClassification
                import torch

                device = torch.device("cpu")
                model = AutoModelForSequenceClassification.from_pretrained(model_path)
                model.to(device)
                model.eval()

                _ter_model = model
                _is_tf = False
                logger.info(f"Loaded PyTorch TER model from {model_path}")

        except Exception as e:
            logger.error(f"Failed to load TER model: {e}")
            raise

    return _tokenizer, _ter_model


def predict_text_emotion(
    text: str,
    model_path: Optional[str] = None,
    emotion_labels: Optional[List[str]] = None
) -> Optional[Dict[str, float]]:
    """Predict emotion probabilities from user text with keyword heuristics."""
    try:
        tokenizer, model = load_ter_model(model_path)
        labels = emotion_labels or settings.EMOTION_LABELS
        emotion_probs = {label: 0.0 for label in labels}

        if _is_tf:
            import tensorflow as tf
            inputs = tokenizer(
                text,
                return_tensors="tf",
                truncation=True,
                max_length=160,
                padding=True
            )
            outputs = model(inputs)
            probs = tf.nn.softmax(outputs.logits, axis=-1).numpy()[0]

            id2label = getattr(model.config, 'id2label', {})
            for idx, p in enumerate(probs):
                raw_label = id2label.get(idx, str(idx))
                mapped = settings.TER_LABEL_MAP.get(raw_label, raw_label)
                if mapped in emotion_probs:
                    emotion_probs[mapped] += float(p)
                elif raw_label in emotion_probs:
                    emotion_probs[raw_label] += float(p)
        else:
            import torch
            import torch.nn.functional as F

            inputs = tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=160,
                padding=True
            )
            inputs = {k: v.to(model.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probabilities = F.softmax(logits, dim=-1)[0].cpu()

            for i, raw_label in enumerate(settings.TER_RAW_LABELS):
                if i >= len(probabilities):
                    continue
                score = float(probabilities[i].item())
                target_emotion = settings.TER_LABEL_MAP.get(raw_label)
                if target_emotion and target_emotion in emotion_probs:
                    emotion_probs[target_emotion] += score

        text_lower = text.lower()

        # Heuristic Keyword Boosting
        surprise_keywords = [
            "wow", "shock", "unexpected", "surprise", "amazing", "omg", "sudden", "unbelievable",
            "cannot believe", "pulled that off", "taken aback", "didn't see that coming", "twist",
            "never guessed", "astonished", "stunned", "flabbergasted", "amazed", "bolt from the blue",
            "baffled", "startled", "no way", "get out of here", "holy moly", "knocked me over",
            "off guard", "left field", "jaw hit the floor", "are you serious"
        ]
        if any(w in text_lower for w in surprise_keywords):
            emotion_probs['surprise'] = emotion_probs.get('surprise', 0) + 2.0

        sad_keywords = [
            "wasn't enough", "failed", "hopeless", "disappointed", "sad", "unhappy", "depressed",
            "tried my best", "lonely", "isolated", "suffering", "devastating", "grief", "loss",
            "heavy weight", "heart break", "miss the way", "silence in the house", "deafening silence",
            "melancholy", "crushing", "drowning in sorrow", "emptiness", "shattered", "broken", "tears",
            "feeling blue", "down in the dumps", "piece of me is missing", "going through the motions",
            "gray and bleak", "crying myself to sleep", "rock bottom", "feeling really blue"
        ]
        if any(w in text_lower for w in sad_keywords):
            emotion_probs['sad'] = emotion_probs.get('sad', 0) + 2.0

        angry_keywords = [
            "furious", "blood boil", "rude", "betrayed", "trust", "injustice", "unacceptable",
            "sick and tired", "how dare", "shut up", "liar", "lie to my face", "accuse",
            "seething", "rage", "infuriates", "condescending", "disgusted", "patience has run out",
            "explode", "outrage", "greed", "resent", "lose it", "push my buttons", "ticked off",
            "last straw", "kidding me", "fuming", "get out of my face"
        ]
        if any(w in text_lower for w in angry_keywords):
            emotion_probs['angry'] = emotion_probs.get('angry', 0) + 2.0

        fear_keywords = [
            "terrible feeling", "bad is about to happen", "nervous", "anxiety", "terrified",
            "scared", "afraid", "panic", "heart is pounding", "following me", "jump out of my skin",
            "dread", "trembling", "eerie", "paranoid", "imminent threat", "blood ran cold",
            "creeps", "freaking out", "stomach is in knots", "cold sweat", "sinking feeling",
            "scared stiff", "suspense is killing me"
        ]
        if any(w in text_lower for w in fear_keywords):
            emotion_probs['fear'] = emotion_probs.get('fear', 0) + 2.0

        happy_keywords = [
            "over the moon", "walking on air", "couldn't be happier", "grinning", "cherry on top",
            "pumped up", "blessed", "on top of the world", "ecstatic", "delighted", "joy",
            "milestone", "dream come true"
        ]
        if any(w in text_lower for w in happy_keywords):
            emotion_probs['happy'] = emotion_probs.get('happy', 0) + 2.0

        neutral_keywords = [
            "partly cloudy", "cloudy", "weather", "forecast", "get back to you", "check the logs",
            "pass me", "sitting here", "it is what it is", "minutes", "business day", "calculated",
            "formula", "blue shirt"
        ]
        if any(w in text_lower for w in neutral_keywords):
            emotion_probs['neutral'] = emotion_probs.get('neutral', 0) + 2.0

        if not emotion_probs:
            return None

        dominant_label, max_score = max(emotion_probs.items(), key=lambda x: x[1])

        # Confidence checks and fallbacks to neutral
        if max_score < 0.50:
            emotion_probs = {label: 0.0 for label in labels}
            emotion_probs['neutral'] = 1.0
            return emotion_probs

        if (dominant_label in ('fear', 'angry')) and max_score < 0.85:
            emotion_probs = {label: 0.0 for label in labels}
            emotion_probs['neutral'] = 1.0
            return emotion_probs

        if dominant_label == 'happy' and max_score < 0.92:
            emotion_probs = {label: 0.0 for label in labels}
            emotion_probs['neutral'] = 1.0
            return emotion_probs

        return emotion_probs

    except Exception as e:
        logger.error(f"TER prediction failed: {e}")
        return None

