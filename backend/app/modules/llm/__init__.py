"""
LLM Module
Handles Generative AI response streaming, prompt engineering, and user intent detection.
"""

from app.modules.llm.client import (
    generate_response,
    generate_response_sync,
    check_llm_health,
    get_llm
)
from app.modules.llm.prompt_builder import (
    build_system_prompt,
    build_user_prompt
)
from app.modules.llm.intent import (
    detect_intent,
    get_intent_description,
    IntentType
)

__all__ = [
    "generate_response",
    "generate_response_sync",
    "check_llm_health",
    "get_llm",
    "build_system_prompt",
    "build_user_prompt",
    "detect_intent",
    "get_intent_description",
    "IntentType",
]

