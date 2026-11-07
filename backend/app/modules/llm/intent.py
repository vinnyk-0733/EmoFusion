"""
Intent Classification
Categorizes user query intent for context-tailored responses.
"""

from typing import Literal

IntentType = Literal["statement", "question", "advice"]


def detect_intent(text: str) -> IntentType:
    """Detect user intent from text using rules (advice, question, statement)."""
    text_lower = text.lower().strip()

    advice_keywords = ["what should", "how can", "suggest", "advice", "help me", "what to do"]
    question_words = ["why", "how", "what", "when", "should i"]

    if any(k in text_lower for k in advice_keywords):
        return "advice"

    if text_lower.endswith("?") or any(q in text_lower for q in question_words):
        return "question"

    return "statement"


def get_intent_description(intent: IntentType) -> str:
    """Return human-readable intent description."""
    descriptions = {
        "statement": "Validating user feelings (Venting/Statement)",
        "question": "Providing specific information (Question)",
        "advice": "Offering guidance and suggestions (Advice Request)"
    }
    return descriptions.get(intent, "General statement")

