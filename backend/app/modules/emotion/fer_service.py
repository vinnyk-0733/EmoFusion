"""
Facial Emotion Recognition (FER) Service
Wraps Keras CNN inference on 48x48 grayscale face crops.
"""

import logging
from typing import Dict, Optional, Tuple, List
import cv2
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

_fer_model = None


def load_fer_model(model_path: Optional[str] = None):
    """Load and cache the Keras FER model."""
    global _fer_model
    if model_path is None:
        model_path = settings.FER_MODEL_PATH

    if _fer_model is None:
        try:
            from tensorflow import keras
            _fer_model = keras.models.load_model(model_path)
            logger.info(f"FER model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load FER model from {model_path}: {e}")
            raise
    return _fer_model


def preprocess_face(face_image: np.ndarray, target_size: tuple = (48, 48)) -> np.ndarray:
    """Preprocess face image for FER model: resize, normalize, add batch dimension."""
    if len(face_image.shape) == 3:
        face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)

    face_resized = cv2.resize(face_image, target_size)
    face_normalized = face_resized.astype(np.float32) / 255.0
    return face_normalized.reshape(1, target_size[0], target_size[1], 1)


def predict_facial_emotion(
    face_image: np.ndarray,
    model_path: Optional[str] = None,
    emotion_labels: Optional[List[str]] = None
) -> Optional[Dict[str, float]]:
    """Predict emotion probabilities from a detected face image."""
    try:
        model = load_fer_model(model_path)
        app_labels = emotion_labels or settings.EMOTION_LABELS

        face_input = preprocess_face(face_image)
        predictions = model.predict(face_input, verbose=0)
        probabilities = predictions[0]

        raw_probs = {}
        for i, label in enumerate(settings.FER_RAW_LABELS):
            if i < len(probabilities):
                raw_probs[label] = float(probabilities[i])

        # Filter to app labels
        emotion_probs = {
            label: raw_probs.get(label, 0.0)
            for label in app_labels
        }
        return emotion_probs
    except Exception as e:
        logger.error(f"FER prediction failed: {e}")
        return None


def get_dominant_emotion(emotion_probs: Optional[Dict[str, float]]) -> Tuple[str, float]:
    """Get the label and probability for the dominant emotion."""
    if not emotion_probs:
        return "neutral", 0.0
    dominant = max(emotion_probs.items(), key=lambda x: x[1])
    return dominant[0], dominant[1]

