from typing import Literal
import logging

logger = logging.getLogger(__name__)

IntentType = Literal["statement", "question", "advice"]

def detect_intent(text: str) -> IntentType:
    """
    Detect user intent from text using specific intent-aware rules.
    
    Returns:
        Intent type: "statement", "question", or "advice"
    """
    text_lower = text.lower().strip()
    
    advice_keywords = ["what should", "how can", "suggest", "advice", "help me", "what to do"]
    question_words = ["why", "how", "what", "when", "should i"] # "should i" is also in advice context often, but user listed it here.
    # Actually user listed "should i" under question words in their example? 
    # User's code: 
    # advice_keywords = ["what should", "how can", "suggest", "advice", "help me", "what to do"]
    # question_words = ["why", "how", "what", "when", "should i"]
    
    # Priority: Advice > Question > Statement
    
    if any(k in text_lower for k in advice_keywords):
        return "advice"
        
    if text_lower.endswith("?") or any(q in text_lower for q in question_words):
        return "question"
        
    return "statement"

def get_intent_description(intent: IntentType) -> str:
    descriptions = {
        "statement": "Validating user feelings (Venting/Statement)",
        "question": "Providing specific information (Question)",
        "advice": "Offering guidance and suggestions (Advice Request)"
    }
    return descriptions.get(intent, "General statement")
