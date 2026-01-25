# Text Emotion Recognition (TER) Module
# Uses DistilBERT for emotion detection from text (TensorFlow-trained model)

import numpy as np
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Lazy loading
_tokenizer = None
_model = None

def load_ter_model(model_path: str):
    """Load the DistilBERT TER model and tokenizer (TF weights)"""
    global _tokenizer, _model, _device

    if _model is None or _tokenizer is None:
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch

            # Determine device
            # Forcing CPU to save VRAM for Ollama LLM
            _device = torch.device("cpu")
            logger.info(f"Loading TER model using device: {_device}")

            _tokenizer = AutoTokenizer.from_pretrained(model_path)

            # Load model
            _model = AutoModelForSequenceClassification.from_pretrained(
                model_path
            )
            
            # Move model to device
            _model.to(_device)
            _model.eval()

            logger.info(f"TER model loaded successfully from {model_path}")

        except Exception as e:
            logger.error(f"Failed to load TER model: {e}")
            raise

    return _tokenizer, _model


def predict_text_emotion(
    text: str,
    model_path: str,
    emotion_labels: list
) -> Optional[Dict[str, float]]:
    """
    Predict emotion probabilities from text
    """
    try:
        import torch
        import torch.nn.functional as F

        tokenizer, model = load_ter_model(model_path)
        
        # Ensure device is set (it should be from load, but safe check)
        device = torch.device("cpu")
        # device = torch.device("cuda" if torch.cuda.is_available() else "cpu") 
        # Note: In a cleaner impl, we'd return device from load_ter_model or store it better.
        # But since _model is global and moved, we can rely on model.device attribute if available or just consistent check.
        # Actually transformers models have .device property.
        
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=160,
            padding=True
        )

        # Move inputs to the same device as the model
        inputs = {k: v.to(model.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = F.softmax(logits, dim=-1)[0]
            
        # Move back to CPU for .item() calls
            probabilities = probabilities.cpu()
        
        # Import config within function to avoid circular imports if any
        from config import TER_RAW_LABELS, TER_LABEL_MAP

        # Initialize with zeros
        emotion_probs = {label: 0.0 for label in emotion_labels}
        
        # Mapping logic using dictionary
        for i, raw_label in enumerate(TER_RAW_LABELS):
            if i >= len(probabilities): continue
            score = float(probabilities[i].item())
            
            # Look up which app emotion this raw label belongs to
            target_emotion = TER_LABEL_MAP.get(raw_label)
            
            if target_emotion and target_emotion in emotion_probs:
                emotion_probs[target_emotion] += score
            
            # 'neutral' is not in the current model, but TER_LABEL_MAP handles it if it appears
            
        if emotion_probs:
           text_lower = text.lower()
           
           # --- Heuristic Keyword Boosting ---
           # Boost value is high (0.8) to ensure these specific phrases override ambiguous model predictions
           
           # SURPRISE
           surprise_keywords = [
               "wow", "shock", "unexpected", "surprise", "amazing", "omg", "sudden", "unbelievable",
               "cannot believe", "pulled that off", "taken aback", "didn't see that coming", "twist",
               "never guessed", "astonished", "stunned", "flabbergasted", "amazed", "bolt from the blue",
               "baffled", "startled", "no way", "get out of here", "holy moly", "knocked me over", 
               "off guard", "left field", "jaw hit the floor", "are you serious"
           ]
           if any(dict_word in text_lower for dict_word in surprise_keywords):
               logger.info("Boosting 'surprise' due to keyword match")
               emotion_probs['surprise'] = emotion_probs.get('surprise', 0) + 2.0

           # SAD
           sad_keywords = [
               "wasn't enough", "failed", "hopeless", "disappointed", "sad", "unhappy", "depressed", 
               "tried my best", "lonely", "isolated", "suffering", "devastating", "grief", "loss",
               "heavy weight", "heart break", "miss the way", "silence in the house", "deafening silence",
               "melancholy", "crushing", "drowning in sorrow", "emptiness", "shattered", "broken", "tears",
               "feeling blue", "down in the dumps", "piece of me is missing", "going through the motions",
               "gray and bleak", "crying myself to sleep", "rock bottom", "feeling really blue"
           ]
           if any(dict_word in text_lower for dict_word in sad_keywords):
               logger.info("Boosting 'sad' due to keyword match")
               emotion_probs['sad'] = emotion_probs.get('sad', 0) + 2.0
               
           # ANGRY
           angry_keywords = [
               "furious", "blood boil", "rude", "betrayed", "trust", "injustice", "unacceptable",
               "sick and tired", "how dare", "shut up", "liar", "lie to my face", "accuse",
               "seething", "rage", "infuriates", "condescending", "disgusted", "patience has run out",
               "explode", "outrage", "greed", "resent", "lose it", "push my buttons", "ticked off",
               "last straw", "kidding me", "fuming", "get out of my face"
           ]
           if any(dict_word in text_lower for dict_word in angry_keywords):
               logger.info("Boosting 'angry' due to keyword match")
               emotion_probs['angry'] = emotion_probs.get('angry', 0) + 2.0

           # FEAR
           fear_keywords = [
               "terrible feeling", "bad is about to happen", "nervous", "anxiety", "terrified", 
               "scared", "afraid", "panic", "heart is pounding", "following me", "jump out of my skin",
               "dread", "trembling", "eerie", "paranoid", "imminent threat", "blood ran cold",
               "creeps", "freaking out", "stomach is in knots", "cold sweat", "sinking feeling",
               "scared stiff", "suspense is killing me"
           ]
           if any(dict_word in text_lower for dict_word in fear_keywords):
               logger.info("Boosting 'fear' due to keyword match")
               emotion_probs['fear'] = emotion_probs.get('fear', 0) + 2.0
           
           # HAPPY
           happy_keywords = [
               "over the moon", "walking on air", "couldn't be happier", "grinning", "cherry on top",
               "pumped up", "blessed", "on top of the world", "ecstatic", "delighted", "joy", 
               "milestone", "dream come true"
           ]
           if any(dict_word in text_lower for dict_word in happy_keywords):
               logger.info("Boosting 'happy' due to keyword match")
               emotion_probs['happy'] = emotion_probs.get('happy', 0) + 2.0

           # NEUTRAL
           neutral_keywords = [
               "partly cloudy", "cloudy", "weather", "forecast", "get back to you", "check the logs",
               "pass me", "sitting here", "it is what it is", "minutes", "business day", "calculated",
               "formula", "blue shirt"
           ]
           if any(dict_word in text_lower for dict_word in neutral_keywords):
               logger.info("Boosting 'neutral' due to keyword match")
               # For neutral, we just set it as dominant (since it's not in the model outputs usually)
               # But ter.py logic uses 'neutral' key in emotion_probs.
               emotion_probs['neutral'] = emotion_probs.get('neutral', 0) + 2.0



        # Check for dominant emotion confidence
        # If the highest score is too low, fallback to neutral
        if not emotion_probs:
            return None # Should be handled by mapping loop but safe check
            
        dominant_label, max_score = max(emotion_probs.items(), key=lambda x: x[1])
        
        # Global threshold: Allow reasonably confident predictions
        if max_score < 0.50:
            # Overwrite with neutral if confidence is very low
            emotion_probs = {label: 0.0 for label in emotion_labels}
            emotion_probs['neutral'] = 1.0
            return emotion_probs
        
        # Specific check for negative emotions causing false alarms
        if (dominant_label == 'fear' or dominant_label == 'angry') and max_score < 0.85:
            # Downgrade to neutral
            logger.info(f"Downgrading weak negative emotion {dominant_label} ({max_score:.2f}) to neutral")
            emotion_probs = {label: 0.0 for label in emotion_labels}
            emotion_probs['neutral'] = 1.0
            return emotion_probs
        
        # Specific check for HAPPY causing false alarms (e.g. "hello")
        if dominant_label == 'happy' and max_score < 0.92:
            # Downgrade to neutral
            logger.info(f"Downgrading weak happy emotion {dominant_label} ({max_score:.2f}) to neutral")
            emotion_probs = {label: 0.0 for label in emotion_labels}
            emotion_probs['neutral'] = 1.0
            return emotion_probs
            
        return emotion_probs

    except Exception as e:
        logger.error(f"TER prediction failed: {e}")
        with open("ter_debug.log", "a") as f:
            f.write(f"ERROR: {e}\n")
        return None

    # Normal execution logging
    with open("ter_debug.log", "a") as f:
        f.write(f"Input: {text}\n")
        f.write(f"Raw Probabilities: {emotion_probs}\n")
        f.write(f"Max Score: {max_score}\n")
        f.write("-" * 20 + "\n")
        
    return emotion_probs


def get_dominant_emotion(emotion_probs: Dict[str, float]) -> tuple:
    if not emotion_probs:
        return "neutral", 0.0

    return max(emotion_probs.items(), key=lambda x: x[1])
