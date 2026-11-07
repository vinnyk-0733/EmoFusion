"""
Emotion Recognition REST API Endpoints
"""

import logging
from fastapi import APIRouter, HTTPException

from app.modules.emotion.schemas import FacialEmotionRequest, TextEmotionRequest, EmotionResponse
from app.modules.emotion.vision_utils import process_image_for_fer
from app.modules.emotion.fer_service import predict_facial_emotion, get_dominant_emotion
from app.modules.emotion.ter_service import predict_text_emotion

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/emotion", tags=["emotion"])


@router.post("/facial", response_model=EmotionResponse)
async def detect_facial_emotion_endpoint(request: FacialEmotionRequest):
    """Detect emotion from a base64 encoded facial image."""
    try:
        if not request.image:
            raise HTTPException(status_code=400, detail="Image data is required")

        face_image = process_image_for_fer(request.image)
        if face_image is None:
            return EmotionResponse(emotion="neutral", confidence=0.0, scores={})

        probs = predict_facial_emotion(face_image)
        if not probs:
            return EmotionResponse(emotion="neutral", confidence=0.0, scores={})

        dominant, confidence = get_dominant_emotion(probs)
        return EmotionResponse(
            emotion=dominant,
            confidence=confidence,
            scores=probs
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Facial emotion API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text", response_model=EmotionResponse)
async def detect_text_emotion_endpoint(request: TextEmotionRequest):
    """Detect emotion from textual input."""
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        probs = predict_text_emotion(request.text)
        if not probs:
            return EmotionResponse(emotion="neutral", confidence=0.0, scores={})

        dominant, confidence = get_dominant_emotion(probs)
        return EmotionResponse(
            emotion=dominant,
            confidence=confidence,
            scores=probs
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text emotion API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

