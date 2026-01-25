# Conversation Memory Manager
# Handles per-session chat history storage and retrieval via MongoDB

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import logging
from bson import ObjectId

from models.db import db
import asyncio

logger = logging.getLogger(__name__)

# We keep these dataclasses if other parts of the system rely on them, 
# but for now we primarily use direct DB access.
# The previous implementation exported ConversationSession which might be imported elsewhere.
# However, checking imports, only memory_manager is usually imported.

class ConversationMemoryManager:
    """
    Manages conversation memory across multiple sessions using MongoDB
    """
    
    def __init__(self):
        pass
    
    def _get_collection(self):
        return db.get_collection("chats")
    
    async def create_session(self, title: str = "New Chat") -> str:
        """Create a new chat session and return its ID"""
        try:
            collection = self._get_collection()
            result = await collection.insert_one({
                "title": title,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "messages": []
            })
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return str(ObjectId()) # Fallback to random ID if DB fails
            
    async def get_history(self, session_id: str, max_turns: int = 10) -> List[Dict]:
        """Get conversation history for a session"""
        try:
            if not ObjectId.is_valid(session_id):
                return []
                
            collection = self._get_collection()
            chat = await collection.find_one({"_id": ObjectId(session_id)})
            
            if not chat or "messages" not in chat:
                return []
            
            # Get last N messages * 2 (user+assistant)
            stored_messages = chat["messages"]
            if max_turns > 0 and len(stored_messages) > max_turns * 2:
                stored_messages = stored_messages[-(max_turns*2):]
            
            formatted_messages = []
            for msg in stored_messages:
                formatted_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                    "emotion": msg.get("emotion")
                })
            
            return formatted_messages
            
        except Exception as e:
            logger.error(f"Error fetching history for {session_id}: {e}")
            return []
    
    async def add_turn(
        self,
        session_id: str,
        user_text: str,
        final_emotion: str,
        mental_state: str,
        assistant_response: str
    ):
        """Add a conversation turn (User + Assistant) to a session"""
        try:
            if not ObjectId.is_valid(session_id):
                return

            collection = self._get_collection()
            
            user_msg = {
                "role": "user",
                "content": user_text,
                "emotion": final_emotion,
                "mental_state": mental_state,
                "timestamp": datetime.now()
            }
            
            assistant_msg = {
                "role": "assistant",
                "content": assistant_response,
                "timestamp": datetime.now()
            }
            
            # Using update_one with await
            await collection.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$push": {
                        "messages": {"$each": [user_msg, assistant_msg]}
                    },
                    "$set": {"updated_at": datetime.now()}
                }
            )
            
        except Exception as e:
            logger.error(f"Error adding turn to {session_id}: {e}")

    async def clear_session(self, session_id: str):
        """Clear a specific session's history"""
        try:
            if not ObjectId.is_valid(session_id):
                return
            collection = self._get_collection()
            await collection.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"messages": [], "updated_at": datetime.now()}}
            )
        except Exception as e:
            logger.error(f"Error clearing session {session_id}: {e}")
    
    async def remove_session(self, session_id: str):
        """Remove a session entirely"""
        try:
            if not ObjectId.is_valid(session_id):
                return
            collection = self._get_collection()
            await collection.delete_one({"_id": ObjectId(session_id)})
        except Exception as e:
            logger.error(f"Error removing session {session_id}: {e}")

    def should_clear(self, user_text: str) -> bool:
        """Check if user wants to clear conversation"""
        clear_commands = ["clear", "reset", "start over", "new conversation"]
        return user_text.lower().strip() in clear_commands

# Global memory manager instance
memory_manager = ConversationMemoryManager()
