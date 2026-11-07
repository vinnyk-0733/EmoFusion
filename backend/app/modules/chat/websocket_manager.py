"""
WebSocket Connection Manager
Tracks active connections and sends JSON payloads.
"""

import logging
from typing import Dict
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections per session ID."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept WebSocket and store under session_id."""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket client connected: {session_id}")

    def disconnect(self, session_id: str):
        """Remove connection on client disconnect."""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket client disconnected: {session_id}")

    async def send_json(self, session_id: str, data: dict):
        """Send JSON payload to the connected client."""
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)


connection_manager = ConnectionManager()

