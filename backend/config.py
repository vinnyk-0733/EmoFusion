# Backend Configuration
# Update these paths to match your model locations

# Model paths
FER_MODEL_PATH = "models/fer_model.keras"  # Your Keras FER model
TER_MODEL_PATH = "bhadresh-savani/distilbert-base-uncased-emotion"  # Hugging Face Model ID

# Emotion weights for fusion
FER_WEIGHT = 0.7
TER_WEIGHT = 0.3

# Emotion labels (must match your model outputs)
# FER Model outputs 7 classes
# Correct mapping from user's Streamlit code: {0:'angry', 1:'disgust', 2:'fear', 3:'happy', 4:'neutral', 5:'sad', 6:'surprise'}
FER_RAW_LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

# TER Model outputs 6 classes (from bhadresh-savani/distilbert-base-uncased-emotion)
TER_RAW_LABELS = ['sadness', 'joy', 'love', 'anger', 'fear', 'surprise']

# Detailed mapping from model labels to app emotions
TER_LABEL_MAP = {
    # Happy category
    "joy": "happy", "amusement": "happy", "optimism": "happy", 
    "excitement": "happy", "love": "happy", "pride": "happy", "relief": "happy",
    
    # Sad category
    "sadness": "sad", "grief": "sad", "remorse": "sad", 
    "disappointment": "sad", "embarrassment": "sad",
    
    # Angry category
    "anger": "angry", "annoyance": "angry", "disapproval": "angry",
    
    # Fear category
    "fear": "fear", "nervousness": "fear",
    
    # Surprise category
    "surprise": "surprise", "realization": "surprise",
    
    # Neutral category
    "neutral": "neutral", "confusion": "neutral", "curiosity": "neutral"
}

# Application uses 6 classes (excluding disgust)
EMOTION_LABELS = ['happy', 'sad', 'angry', 'fear', 'surprise', 'neutral']

# Mental state mapping
EMOTION_TO_MENTAL_STATE = {
    "sad": "Low mood",
    "fear": "Anxiety",
    "angry": "Stress",
    "neutral": "Stable",
    "happy": "Positive mood",
    "surprise": "Excited",
    "disgust": "Discomfort"
}

# llama.cpp server configuration
LLAMA_SERVER_URL = "http://localhost:8081"
GGUF_MODEL_PATH = "../model/ministral3b-q4.gguf"

# MongoDB Configuration
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "emofusion_db"

# Face detection
HAAR_CASCADE_PATH = "haarcascade_frontalface_default.xml"
FACE_SIZE = (48, 48)

# Safety disclaimer
HEALTHCARE_DISCLAIMER = "I'm an AI assistant designed to provide emotional support, not a substitute for professional medical care. Please consult healthcare professionals for medical advice."

# Intent keywords
HEALTHCARE_KEYWORDS = [
    "feel", "feeling", "sad", "anxious", "depressed", "stress", "worried",
    "lonely", "scared", "panic", "mental", "therapy", "counseling", "help me",
    "overwhelmed", "tired", "exhausted", "hopeless", "crying", "hurt"
]

GENERAL_KEYWORDS = [
    "joke", "funny", "code", "explain", "what is", "how to", "calculate",
    "write", "create", "build", "help with", "tell me about", "weather"
]
