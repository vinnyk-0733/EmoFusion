# WebSocket API Endpoint
# Handles real-time chat communication

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Optional
import json
import uuid
import logging
import asyncio

from models.fer import predict_emotion as predict_fer
from models.ter import predict_text_emotion as predict_ter
from models.fusion import process_emotions
from utils.image_utils import process_image_for_fer
from utils.intent import detect_intent
from memory.conversation import memory_manager
from llm.prompt_builder import build_system_prompt, build_user_prompt
from llm.mistral import generate_response
from config import FER_MODEL_PATH, TER_MODEL_PATH, EMOTION_LABELS

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

router = APIRouter()

class ConnectionManager:
    """Manage active WebSocket connections"""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"Client connected: {session_id}")
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            # memory_manager.remove_session(session_id) # Don't remove session from DB on disconnect
            logger.info(f"Client disconnected: {session_id}")
    
    async def send_json(self, session_id: str, data: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)

manager = ConnectionManager()

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, chat_id: Optional[str] = None):
    """
    Main WebSocket endpoint for chat
    """
    # Accept connection happens in manager.connect usually, but here we might need to create session first
    # So we accept first if we are doing logic before manager.connect? 
    # Actually manager.connect calls await websocket.accept().
    
    # We need to handle the initial handshake.
    # FastAPI WebSocket connects immediately.
    
    # Wait, if we put chat_id in the query param: ws://.../ws/chat?chat_id=...
    # FastAPI parses it automatically.

    if not chat_id:
        chat_id = await memory_manager.create_session()
        logger.info(f"Created new chat session: {chat_id}")
    else:
        logger.info(f"Resuming chat session: {chat_id}")

    session_id = chat_id
    
    await manager.connect(websocket, session_id)
    
    # Track active tasks and stop signals for this session
    active_tasks = {} # session_id -> asyncio.Task
    stop_events = {}  # session_id -> asyncio.Event
    
    # Send connection confirmation
    await manager.send_json(session_id, {
        "type": "connected",
        "data": {"session_id": session_id}
    })
    
    try:
        while True:
            # Receive message
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
                # Create a stop event for this generation
                stop_event = asyncio.Event()
                stop_events[session_id] = stop_event
                
                # Run handler in background so we can receive stop signals
                task = asyncio.create_task(
                    handle_chat_message(session_id, message, stop_event)
                )
                active_tasks[session_id] = task
                
                # Cleanup callback
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
                    # Send confirmation
                    await manager.send_json(session_id, {
                        "type": "interrupted",
                        "data": {"message": "Generation stopped"}
                    })
                    
            elif msg_type == "clear":
                await memory_manager.clear_session(session_id)
                await manager.send_json(session_id, {
                    "type": "cleared",
                    "data": {"message": "Conversation cleared"}
                })
            elif msg_type == "ping":
                await manager.send_json(session_id, {"type": "pong"})
            
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        # Cancel any running task
        if session_id in active_tasks:
            active_tasks[session_id].cancel()
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id)

async def handle_chat_message(session_id: str, message: dict, stop_event: Optional[asyncio.Event] = None):
    """Process a chat message and generate response"""
    
    text = message.get("text", "").strip()
    image_base64 = message.get("image")
    
    if not text:
        await manager.send_json(session_id, {
            "type": "error",
            "data": {"message": "Message text is required"}
        })
        return
    
    # Check for clear command
    if memory_manager.should_clear(text):
        await memory_manager.clear_session(session_id)
        await manager.send_json(session_id, {
            "type": "response",
            "data": {
                "message": "I've cleared our conversation. Feel free to start fresh!",
                "emotion": "neutral",
                "mental_state": "Stable"
            }
        })
        return
    
    # Run FER and TER in parallel
    fer_probs = None
    ter_probs = None
    
    async def run_fer():
        nonlocal fer_probs
        if image_base64:
            try:
                from models.landmarks import landmark_analyzer
                from utils.image_utils import decode_base64_image, detect_face, extract_face
                import cv2
                import numpy as np

                # 1. Decode and Get Full Face
                image = decode_base64_image(image_base64)
                if image is not None:
                    face_rect = detect_face(image)
                    if face_rect is not None:
                        face_full = extract_face(image, face_rect)
                        
                        # 2. Run Landmark Analysis (on full resolution)
                        landmark_boosts = landmark_analyzer.analyze(face_full)
                        
                        # 3. Process for CNN (48x48 Grayscale)
                        face_gray = cv2.cvtColor(face_full, cv2.COLOR_BGR2GRAY)
                        fer_probs = predict_fer(face_gray, FER_MODEL_PATH, EMOTION_LABELS)
                        
                        # 4. Apply Landmark Boosts
                        if fer_probs and landmark_boosts:
                            logger.info(f"Applying Landmark Boosts: {landmark_boosts}")
                            for emotion, boost_score in landmark_boosts.items():
                                # Apply boost: strongly favor the geometric finding
                                current_score = fer_probs.get(emotion, 0.0)
                                if boost_score > current_score:
                                    fer_probs[emotion] = boost_score
                                    
                                # If Smile Detected effectively, suppress Sad/Angry
                                if emotion == 'happy' and boost_score > 0.6:
                                    fer_probs['sad'] = min(fer_probs.get('sad', 0), 0.2)
                                    fer_probs['angry'] = min(fer_probs.get('angry', 0), 0.2) 
            except Exception as e:
                logger.warning(f"FER failed: {e}")
    
    async def run_ter():
        nonlocal ter_probs
        try:
            ter_probs = predict_ter(text, TER_MODEL_PATH, EMOTION_LABELS)
        except Exception as e:
            logger.warning(f"TER failed: {e}")
    
    # Run emotion detection in parallel
    await asyncio.gather(
        run_fer(),
        run_ter(),
        return_exceptions=True
    )
    
    # Process emotions (Dual-Input, No Fusion)
    emotion_result = process_emotions(fer_probs, ter_probs)
    
    fer_emotion = emotion_result.get("fer_emotion")
    ter_emotion = emotion_result.get("ter_emotion")
    final_emotion = emotion_result["final_emotion"]
    mental_state = emotion_result["mental_state"]
    
    # Send emotion update
    await manager.send_json(session_id, {
        "type": "emotion",
        "data": {
            "emotion": final_emotion,
            "mental_state": mental_state,
            # Use fer_score if available, else ter_score, just for UI visualization
            "confidence": emotion_result.get("fer_score", 0.0) if fer_emotion else emotion_result.get("ter_score", 0.0),
            "scores": emotion_result["fused_scores"],
            "fer_available": emotion_result["fer_available"],
            "ter_available": emotion_result["ter_available"]
        }
    })
    
    # Detect intent
    intent = detect_intent(text)
    
    # Get conversation history
    history = await memory_manager.get_history(session_id)
    
    # Build prompts (Injecting Dual Context)
    system_prompt = build_system_prompt(fer_emotion, ter_emotion, mental_state, intent)
    user_prompt = build_user_prompt(text, history, final_emotion)
    
    # Generate and stream response
    full_response = ""
    
    async for chunk in generate_response(system_prompt, user_prompt, stream=True, stop_event=stop_event):
        full_response += chunk
        await manager.send_json(session_id, {
            "type": "stream",
            "data": {"chunk": chunk}
        })
    
    # Send completion
    await manager.send_json(session_id, {
        "type": "response",
        "data": {
            "message": full_response,
            "emotion": final_emotion,
            "mental_state": mental_state
        }
    })
    
    # Save to memory
    await memory_manager.add_turn(
        session_id=session_id,
        user_text=text,
        final_emotion=final_emotion,
        mental_state=mental_state,
        assistant_response=full_response
    )
