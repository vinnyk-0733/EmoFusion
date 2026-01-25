# REST API Endpoints
# Handles independent emotion detection requests

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import base64
import numpy as np
import cv2
import logging

from models.fer import predict_emotion as predict_fer
from models.ter import predict_text_emotion as predict_ter
from config import FER_MODEL_PATH, TER_MODEL_PATH, EMOTION_LABELS
from utils.image_utils import process_image_for_fer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

class TextRequest(BaseModel):
    text: str

class ImageRequest(BaseModel):
    image: str  # Base64 string

@router.post("/emotion/facial")
async def detect_facial_emotion(request: ImageRequest):
    """Detect emotion from base64 image"""
    try:
        # Decode image
        if not request.image:
            raise HTTPException(status_code=400, detail="Image data required")
            
        face_image = process_image_for_fer(request.image)
        if face_image is None:
             # Just return neutral if no face found, or error? Frontend expects emotion.
             # Returning neutral is safer for continuous polling.
             return {"emotion": "neutral", "confidence": 0.0}

        emotion_probs = predict_fer(face_image, FER_MODEL_PATH, EMOTION_LABELS)
        
        if not emotion_probs:
            return {"emotion": "neutral", "confidence": 0.0}
            
        dominant_emotion = max(emotion_probs.items(), key=lambda x: x[1])
        return {
            "emotion": dominant_emotion[0],
            "confidence": dominant_emotion[1],
            "scores": emotion_probs
        }

    except Exception as e:
        logger.error(f"Facial emotion API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emotion/text")
async def detect_text_emotion(request: TextRequest):
    """Detect emotion from text"""
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Text required")
            
        emotion_probs = predict_ter(request.text, TER_MODEL_PATH, EMOTION_LABELS)
        
        if not emotion_probs:
             return {"emotion": "neutral", "confidence": 0.0}
             
        dominant_emotion = max(emotion_probs.items(), key=lambda x: x[1])
        return {
            "emotion": dominant_emotion[0],
            "confidence": dominant_emotion[1],
            "scores": emotion_probs
        }

    except Exception as e:
        logger.error(f"Text emotion API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
