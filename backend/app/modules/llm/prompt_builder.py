"""
Prompt Builder
Constructs context-aware system prompts and user message histories.
"""

from typing import Dict, List, Optional
from app.modules.llm.intent import IntentType


def build_system_prompt(
    fer_emotion: Optional[str],
    ter_emotion: Optional[str],
    mental_state: str,
    intent: IntentType,
    include_disclaimer: bool = True
) -> str:
    """Build strict system prompt with conditional logic for camera state and user intent."""
    base_persona = "You are EmoAI, an emotionally intelligent companion."

    if fer_emotion:
        # Camera is ON
        input_context = f"""
    INPUTS:
    - User's Facial Expression: {fer_emotion}
    - User's Text Tone: {ter_emotion}
    - Derived Mental State: {mental_state}
        """

        response_format = """
    RESPONSE FORMAT:
    1. If there's a MISMATCH between face and text emotion (e.g., Happy Face + Sad Text):
       - Gently acknowledge it ONCE: "You say you're [Text Tone], but you look [Face Emotion]..."
       - Then provide your main response.
    2. If emotions MATCH or haven't changed from the previous message:
       - Do NOT repeat the emotion observation. Just respond naturally.
    3. Never start with "EmoAI:" — respond as a natural, caring companion.
        """
    else:
        # Camera is OFF
        input_context = f"""
    INPUTS:
    - User's Text Tone: {ter_emotion if ter_emotion else 'Neutral'}
    - Derived Mental State: {mental_state}
    - (Camera is OFF: Do NOT mention facial expressions or "looking" at the user.)
        """

        response_format = """
    RESPONSE FORMAT:
    1. Only mention the user's emotion if it has CHANGED or is notably strong.
       - If emotion changed: "You sound [Text Tone]..." then respond.
       - If emotion is the same as before: Just respond naturally without restating it.
    2. Never start with "EmoAI:" — respond as a natural, caring companion.
        """

    # Intent Logic
    if intent == "advice":
        intent_instruction = "User Intent: ADVICE REQUEST. Provide actionable, helpful advice based on their situation."
    elif intent == "question":
        intent_instruction = "User Intent: QUESTION. Answer directly and briefly."
    else:
        intent_instruction = "User Intent: CHAT/VENTING. Be empathetic, listen, and supportive. Do NOT give unsolicited advice."

    prompt = f"""{base_persona}

{input_context}

{intent_instruction}

{response_format}

General Rules:
- Be natural and human-like.
- Keep responses concise — 2 to 3 sentences max unless the user asks for detail.
- Prioritize the 'Mental State' for your emotional tone.
- If Camera is ON and there is a mismatch, believe the FACE (Masking).
"""
    return prompt


def build_user_prompt(
    current_message: str,
    conversation_history: List[Dict],
    emotion: str
) -> str:
    """Build the user-facing prompt including relevant previous turns."""
    history_text = ""
    if conversation_history:
        history_text = "\n\nPREVIOUS CONVERSATION:\n"
        for msg in conversation_history[-2:]:
            role = msg.get("role", "").upper()
            content = msg.get("content", "")
            emotion_note = f" [Feeling: {msg.get('emotion', '')}]" if msg.get("emotion") else ""
            history_text += f"{role}{emotion_note}: {content}\n"

    prompt = f"""{history_text}
CURRENT MESSAGE:
User [Feeling: {emotion}]: {current_message}

Please respond thoughtfully, considering the user's emotional state and conversation history."""
    return prompt

