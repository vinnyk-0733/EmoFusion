# Facial Emotion Recognition (FER) Module
# Uses Keras model for emotion detection from facial images

import numpy as np
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Lazy loading for TensorFlow
_model = None

def load_fer_model(model_path: str):
    """Load the Keras FER model"""
    global _model
    if _model is None:
        try:
            from tensorflow import keras
            _model = keras.models.load_model(model_path)
            logger.info(f"FER model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load FER model: {e}")
            raise
    return _model

def preprocess_face(face_image: np.ndarray, target_size: tuple = (48, 48)) -> np.ndarray:
    """
    Preprocess face image for FER model
    - Resize to target size
    - Normalize pixel values
    - Add batch dimension
    """
    import cv2
    
    # Ensure grayscale
    if len(face_image.shape) == 3:
        face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
    
    # Resize
    face_resized = cv2.resize(face_image, target_size)
    
    # Normalize to [0, 1]
    face_normalized = face_resized.astype(np.float32) / 255.0
    
    # Reshape for model input (batch, height, width, channels)
    face_input = face_normalized.reshape(1, target_size[0], target_size[1], 1)
    
    return face_input

def predict_emotion(
    face_image: np.ndarray,
    model_path: str,
    emotion_labels: list
) -> Optional[Dict[str, float]]:
    """
    Predict emotion probabilities from face image
    
    Args:
        face_image: Preprocessed face image (grayscale, 48x48)
        model_path: Path to Keras model
        emotion_labels: List of emotion labels matching model output
    
    Returns:
        Dictionary of emotion probabilities or None if prediction fails
    """
    try:
        model = load_fer_model(model_path)
        
        # Preprocess
        face_input = preprocess_face(face_image)
        
        # Predict
        predictions = model.predict(face_input, verbose=0)
        probabilities = predictions[0]
        
        # Import config for raw labels
        from config import FER_RAW_LABELS, EMOTION_LABELS as APP_LABELS
        
        # Create full probability dict using raw labels (7 classes)
        raw_probs = {}
        for i, label in enumerate(FER_RAW_LABELS):
            if i < len(probabilities):
                raw_probs[label] = float(probabilities[i])
        
        # Filter to only app labels (exclude disgust)
        # Filter to only app labels (exclude disgust)
        emotion_probs = {
            label: raw_probs.get(label, 0.0)
            for label in APP_LABELS
        }
        
        # Bias Correction blocks removed as per user request.
        # Returning raw (filtered) probabilities.
        
        logger.debug(f"FER predictions: {emotion_probs}")
        return emotion_probs
             
        logger.debug(f"FER predictions: {emotion_probs}")
        return emotion_probs
        
    except Exception as e:
        logger.error(f"FER prediction failed: {e}")
        return None

def get_dominant_emotion(emotion_probs: Dict[str, float]) -> tuple:
    """Get the emotion with highest probability"""
    if not emotion_probs:
        return "neutral", 0.0
    
    dominant = max(emotion_probs.items(), key=lambda x: x[1])
    return dominant[0], dominant[1]
