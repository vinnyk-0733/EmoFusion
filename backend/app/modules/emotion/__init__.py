"""
Emotion Module
Handles Facial Emotion Recognition (FER), Text Emotion Recognition (TER),
facial landmarks analysis, multimodal mental state mapping, and emotion REST routes.
"""

from app.modules.emotion.router import router as emotion_router
from app.modules.emotion.fer_service import predict_facial_emotion, load_fer_model
from app.modules.emotion.ter_service import predict_text_emotion, load_ter_model
from app.modules.emotion.fusion_service import process_emotions, derive_mental_state
from app.modules.emotion.landmarks import landmark_analyzer
from app.modules.emotion.vision_utils import (
    decode_base64_image,
    detect_face,
    extract_face,
    process_image_for_fer
)

__all__ = [
    "emotion_router",
    "predict_facial_emotion",
    "load_fer_model",
    "predict_text_emotion",
    "load_ter_model",
    "process_emotions",
    "derive_mental_state",
    "landmark_analyzer",
    "decode_base64_image",
    "detect_face",
    "extract_face",
    "process_image_for_fer",
]

