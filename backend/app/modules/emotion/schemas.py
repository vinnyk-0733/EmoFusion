"""
Emotion Recognition Schemas
"""

from pydantic import BaseModel, Field
from typing import Dict, Optional, Any


class TextEmotionRequest(BaseModel):
    text: str = Field(..., description="User input text to classify emotion for")


class FacialEmotionRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded webcam image string")


class EmotionResponse(BaseModel):
    emotion: str
    confidence: float
    scores: Optional[Dict[str, float]] = None


class MultimodalEmotionResult(BaseModel):
    fer_emotion: Optional[str] = None
    fer_score: float = 0.0
    ter_emotion: Optional[str] = None
    ter_score: float = 0.0
    final_emotion: str
    mental_state: str
    fer_available: bool = False
    ter_available: bool = False
    fused_scores: Dict[str, float] = {}

