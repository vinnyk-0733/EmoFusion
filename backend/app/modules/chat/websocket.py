"""
WebSocket Chat Handler
Coordinates real-time multimodal emotion detection, LangChain Gemini LLM streaming,
and message persistence.
"""

import json
import logging
import asyncio
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.modules.chat.websocket_manager import connection_manager as manager
from app.modules.chat.service import chat_service
from app.modules.emotion.fer_service import predict_facial_emotion
from app.modules.emotion.ter_service import predict_text_emotion
from app.modules.emotion.fusion_service import process_emotions
from app.modules.emotion.landmarks import landmark_analyzer
from app.modules.emotion.vision_utils import (
    decode_base64_image,
    detect_face,
    extract_face
)
from app.modules.llm.client import generate_response
from app.modules.llm.prompt_builder import build_system_prompt, build_user_prompt
from app.modules.llm.intent import detect_intent

import cv2

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, chat_id: Optional[str] = None):
    """Main WebSocket endpoint for real-time emotion-aware conversational AI."""
    import uuid
    if not chat_id:
        session_id = f"ephemeral-{uuid.uuid4().hex[:12]}"
        logger.info(f"Initialized ephemeral session: {session_id}")
    else:
        session_id = chat_id
        logger.info(f"Resuming chat session: {session_id}")

    await manager.connect(websocket, session_id)

    active_tasks: dict = {}
    stop_events: dict = {}

    # Send connection confirmation
    await manager.send_json(session_id, {
        "type": "connected",
        "data": {"session_id": session_id}
    })

    try:
        while True:
            raw_data = await websocket.receive_text()

            try:
                message = json.loads(raw_data)
            except json.JSONDecodeError:
                await manager.send_json(session_id, {
                    "type": "error",
                    "data": {"message": "Invalid JSON format"}
                })
                continue

            msg_type = message.get("type", "message")

            if msg_type == "message":
                stop_event = asyncio.Event()
                stop_events[session_id] = stop_event

                task = asyncio.create_task(
                    handle_chat_message(session_id, message, stop_event)
                )
                active_tasks[session_id] = task

                def cleanup(t):
                    if session_id in active_tasks and active_tasks[session_id] == t:
                        del active_tasks[session_id]
                    if session_id in stop_events:
                        del stop_events[session_id]

                task.add_done_callback(cleanup)

            elif msg_type == "stop":
                if session_id in stop_events:
                    stop_events[session_id].set()
                    logger.info(f"Stop signal received for session {session_id}")
                    await manager.send_json(session_id, {
                        "type": "interrupted",
                        "data": {"message": "Generation stopped"}
                    })

            elif msg_type == "clear":
                await chat_service.clear_session(session_id)
                await manager.send_json(session_id, {
                    "type": "cleared",
                    "data": {"message": "Conversation cleared"}
                })

            elif msg_type == "ping":
                await manager.send_json(session_id, {"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(session_id)
        if session_id in active_tasks:
            active_tasks[session_id].cancel()
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id)


async def handle_chat_message(
    session_id: str,
    message: dict,
    stop_event: Optional[asyncio.Event] = None
):
    """Process user message, analyze multimodal emotions, stream Gemini response, and save turn."""
    text = message.get("text", "").strip()
    image_base64 = message.get("image")

    if not text:
        await manager.send_json(session_id, {
            "type": "error",
            "data": {"message": "Message text is required"}
        })
        return

    # Check for conversation clear command
    if chat_service.should_clear(text):
        await chat_service.clear_session(session_id)
        await manager.send_json(session_id, {
            "type": "response",
            "data": {
                "message": "I've cleared our conversation. Feel free to start fresh!",
                "emotion": "neutral",
                "mental_state": "Stable"
            }
        })
        return

    fer_probs = None
    ter_probs = None

    async def run_fer():
        nonlocal fer_probs
        if image_base64:
            try:
                image = decode_base64_image(image_base64)
                if image is not None:
                    face_rect = detect_face(image)
                    if face_rect is not None:
                        face_full = extract_face(image, face_rect)

                        # Geometric landmark analysis
                        landmark_boosts = landmark_analyzer.analyze(face_full)

                        # CNN inference
                        face_gray = cv2.cvtColor(face_full, cv2.COLOR_BGR2GRAY)
                        fer_probs = predict_facial_emotion(face_gray)

                        # Apply landmark boosts
                        if fer_probs and landmark_boosts:
                            for emotion, boost_score in landmark_boosts.items():
                                current_score = fer_probs.get(emotion, 0.0)
                                if boost_score > current_score:
                                    fer_probs[emotion] = boost_score

                                if emotion == "happy" and boost_score > 0.6:
                                    fer_probs["sad"] = min(fer_probs.get("sad", 0), 0.2)
                                    fer_probs["angry"] = min(fer_probs.get("angry", 0), 0.2)
            except Exception as e:
                logger.warning(f"FER extraction failed: {e}")

    async def run_ter():
        nonlocal ter_probs
        try:
            ter_probs = predict_text_emotion(text)
        except Exception as e:
            logger.warning(f"TER extraction failed: {e}")

    # Run emotion analysis in parallel
    await asyncio.gather(run_fer(), run_ter(), return_exceptions=True)

    emotion_result = process_emotions(fer_probs, ter_probs)
    fer_emotion = emotion_result.get("fer_emotion")
    ter_emotion = emotion_result.get("ter_emotion")
    final_emotion = emotion_result["final_emotion"]
    mental_state = emotion_result["mental_state"]

    # Broadcast emotion analysis update to client
    await manager.send_json(session_id, {
        "type": "emotion",
        "data": {
            "emotion": final_emotion,
            "mental_state": mental_state,
            "confidence": emotion_result.get("fer_score", 0.0) if fer_emotion else emotion_result.get("ter_score", 0.0),
            "scores": emotion_result["fused_scores"],
            "fer_available": emotion_result["fer_available"],
            "ter_available": emotion_result["ter_available"]
        }
    })

    # Detect user intent and fetch recent history
    intent = detect_intent(text)
    history = await chat_service.get_history(session_id)

    # Build prompts
    system_prompt = build_system_prompt(fer_emotion, ter_emotion, mental_state, intent)
    user_prompt = build_user_prompt(text, history, final_emotion)

    # Stream Generative AI response
    full_response = ""
    async for chunk in generate_response(system_prompt, user_prompt, stream=True, stop_event=stop_event):
        full_response += chunk
        await manager.send_json(session_id, {
            "type": "stream",
            "data": {"chunk": chunk}
        })

    # Broadcast final completion
    await manager.send_json(session_id, {
        "type": "response",
        "data": {
            "message": full_response,
            "emotion": final_emotion,
            "mental_state": mental_state
        }
    })

    # Save conversation turn in database
    await chat_service.add_turn(
        chat_id=session_id,
        user_text=text,
        final_emotion=final_emotion,
        mental_state=mental_state,
        assistant_response=full_response
    )

