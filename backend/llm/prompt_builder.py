# LLM Prompt Builder
# Constructs dynamic system and user prompts based on context

from typing import Dict, List, Optional
import logging

from config import HEALTHCARE_DISCLAIMER, EMOTION_TO_MENTAL_STATE
from utils.intent import IntentType

logger = logging.getLogger(__name__)

def build_system_prompt(
    fer_emotion: Optional[str],
    ter_emotion: Optional[str],
    mental_state: str,
    intent: IntentType,
    include_disclaimer: bool = True
) -> str:
    """
    Build strict system prompt with Conditional Logic for Camera State and User Intent.
    """
    
    # --- 1. Determine Core Persona & Input Type ---
    # Relaxed persona, not just "healthcare".
    base_persona = "You are EmoAI, an emotionally intelligent companion."
    
    # --- 2. Camera State Logic ---
    if fer_emotion:
        # CAMERA ON (Dual Input)
        input_context = f"""
    INPUTS:
    - User's Facial Expression: {fer_emotion}
    - User's Text Tone: {ter_emotion}
    - Derived Mental State: {mental_state}
        """
        
        response_format = f"""
    RESPONSE FORMAT (STRICT):
    1. Start with "EmoAI: ".
    2. Then, explicitly state what you observe in ONE sentence:
       - If Mismatch (e.g. Happy Face, Sad Text): "EmoAI: You say you are [Text Tone], but you look [Face Emotion]..."
       - If Match: "EmoAI: You sound [Text Tone] and you look [Face Emotion]..."
    3. Then, provide your main response.
        """
        
    else:
        # CAMERA OFF (Text Only)
        input_context = f"""
    INPUTS:
    - User's Text Tone: {ter_emotion if ter_emotion else 'Neutral'}
    - Derived Mental State: {mental_state}
    - (Camera is OFF: Do NOT mention facial expressions or "looking" at the user.)
        """
        
        response_format = f"""
    RESPONSE FORMAT (STRICT):
    1. Start with "EmoAI: ".
    2. Then, state only what you hear/read:
       - "EmoAI: You sound [Text Tone]..."
    3. Then, provide your main response.
        """

    # --- 3. Intent Logic (Advice vs Suggestion vs Chat) ---
    intent_instruction = ""
    if intent == "advice":
        intent_instruction = "User Intent: ADVICE REQUEST. Provide actionable, helpful advice based on their situation."
    elif intent == "suggestion":
        intent_instruction = "User Intent: SUGGESTION REQUEST. Provide clear, constructive suggestions."
    elif intent == "question":
        intent_instruction = "User Intent: QUESTION. Answer directly and briefly."
    else:
        intent_instruction = "User Intent: CHAT/VENTING. Be empathetic, listen, and supportive. Do NOT give unsolicited advice."

    # --- 4. Assemble Final Prompt ---
    prompt = f"""{base_persona}

{input_context}

{intent_instruction}

{response_format}

General Rules:
- Be natural and human-like.
- Prioritize the 'Mental State' for your emotional tone.
- If Camera is ON and there is a mismatch, believe the FACE (Masking).
"""

    return prompt

# Removed obsolete get_emotion_guidance and get_role_guidance functions as they promoted over-explaining.

def build_user_prompt(
    current_message: str,
    conversation_history: List[Dict],
    emotion: str
) -> str:
    """
    Build the user-facing prompt including conversation history
    
    Args:
        current_message: Current user message
        conversation_history: Previous conversation turns
        emotion: Current detected emotion
    
    Returns:
        Formatted prompt with context
    """
    # Build history context
    if conversation_history:
        history_text = "\n\nPREVIOUS CONVERSATION:\n"
        for msg in conversation_history[-6:]:  # Last 3 exchanges
            role = msg.get("role", "").upper()
            content = msg.get("content", "")
            emotion_note = f" [Feeling: {msg.get('emotion', '')}]" if msg.get("emotion") else ""
            history_text += f"{role}{emotion_note}: {content}\n"
    else:
        history_text = ""
    
    prompt = f"""{history_text}
CURRENT MESSAGE:
User [Feeling: {emotion}]: {current_message}

Please respond thoughtfully, considering the user's emotional state and conversation history."""
    
    return prompt
