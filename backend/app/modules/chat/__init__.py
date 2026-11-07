"""
Chat Module
Handles conversation sessions, messages, soft deletes, likes, WebSocket orchestration,
and REST routes.
"""

from app.modules.chat.router import router as chat_router
from app.modules.chat.websocket import router as websocket_router
from app.modules.chat.service import chat_service
from app.modules.chat.websocket_manager import connection_manager
from app.modules.chat.schemas import (
    Chat,
    Message,
    CreateChatRequest,
    UpdateChatRequest,
    PyObjectId
)

__all__ = [
    "chat_router",
    "websocket_router",
    "chat_service",
    "connection_manager",
    "Chat",
    "Message",
    "CreateChatRequest",
    "UpdateChatRequest",
    "PyObjectId",
]

