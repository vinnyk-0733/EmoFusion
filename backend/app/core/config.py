"""
Core Configuration
Loads environment variables and sets up application-wide constants.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve project paths
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
ENV_FILE = PROJECT_ROOT / ".env"

# Load environment variables
load_dotenv(ENV_FILE)
# Fallback to backend/.env if present
load_dotenv(BACKEND_DIR / ".env")


class Settings:
    # Project Paths
    BACKEND_PATH: Path = BACKEND_DIR
    PROJECT_ROOT_PATH: Path = PROJECT_ROOT

    # Database Configuration
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "emofusiondb")

    # Gemini Generative AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # ML Model Paths (encapsulated inside emotion module)
    MODELS_PATH: Path = BACKEND_DIR / "app" / "modules" / "emotion" / "models"
    FER_MODEL_PATH: str = str(MODELS_PATH / "fer_model_fixed.h5")
    TER_LOCAL_DIR: Path = MODELS_PATH / "ter_model"
    TER_MODEL_PATH: str = str(TER_LOCAL_DIR) if (TER_LOCAL_DIR / "ter_model.h5").exists() else "bhadresh-savani/distilbert-base-uncased-emotion"
    LBF_MODEL_PATH: str = str(MODELS_PATH / "lbfmodel.yaml")

    # Emotion Weights for Multimodal Fusion
    FER_WEIGHT: float = 0.7
    TER_WEIGHT: float = 0.3

    # Emotion Labels
    FER_RAW_LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
    TER_RAW_LABELS = ['sadness', 'joy', 'love', 'anger', 'fear', 'surprise']
    EMOTION_LABELS = ['happy', 'sad', 'angry', 'fear', 'surprise', 'neutral']

    # Text Emotion Mapping (6 model labels -> 6 app labels)
    TER_LABEL_MAP = {
        "joy": "happy", "amusement": "happy", "optimism": "happy",
        "excitement": "happy", "love": "happy", "pride": "happy", "relief": "happy",
        "sadness": "sad", "grief": "sad", "remorse": "sad",
        "disappointment": "sad", "embarrassment": "sad",
        "anger": "angry", "annoyance": "angry", "disapproval": "angry",
        "fear": "fear", "nervousness": "fear",
        "surprise": "surprise", "realization": "surprise",
        "neutral": "neutral", "confusion": "neutral", "curiosity": "neutral"
    }

    # Mental State Mapping (single emotion fallback)
    EMOTION_TO_MENTAL_STATE = {
        "sad": "Low mood",
        "fear": "Anxiety",
        "angry": "Stress",
        "neutral": "Stable",
        "happy": "Positive mood",
        "surprise": "Excited",
        "disgust": "Discomfort"
    }

    # Vision Constants
    FACE_SIZE: tuple = (48, 48)

    # Healthcare Context
    HEALTHCARE_DISCLAIMER: str = (
        "I'm an AI assistant designed to provide emotional support, not a substitute "
        "for professional medical care. Please consult healthcare professionals for medical advice."
    )


settings = Settings()

