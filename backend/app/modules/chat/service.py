"""
Chat Domain Service
Encapsulates all database operations, message history management, soft deletes, and likes.
"""

import logging
from datetime import datetime
from typing import List, Dict, Optional, Any
from bson import ObjectId

from app.core.database import db

logger = logging.getLogger(__name__)


class ChatService:
    """Manages chat conversations and message history in MongoDB."""

    @staticmethod
    def _collection():
        return db.get_collection("chats")

    async def create_chat(self, title: str = "New Chat") -> Dict[str, Any]:
        """Create a new chat conversation."""
        now = datetime.now()
        chat_doc = {
            "title": title,
            "created_at": now,
            "updated_at": now,
            "messages": []
        }
        result = await self._collection().insert_one(chat_doc)
        return await self._collection().find_one({"_id": result.inserted_id})

    async def list_chats(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List recent chat conversations sorted by updated_at descending."""
        return await self._collection().find().sort("updated_at", -1).to_list(limit)

    async def get_chat(self, chat_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single chat by its ObjectId."""
        if not ObjectId.is_valid(chat_id):
            return None
        return await self._collection().find_one({"_id": ObjectId(chat_id)})

    async def update_chat_title(self, chat_id: str, title: str) -> Optional[Dict[str, Any]]:
        """Update chat title."""
        if not ObjectId.is_valid(chat_id):
            return None
        await self._collection().update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"title": title, "updated_at": datetime.now()}}
        )
        return await self.get_chat(chat_id)

    async def delete_chat(self, chat_id: str) -> bool:
        """Delete a chat by ID."""
        if not ObjectId.is_valid(chat_id):
            return False
        result = await self._collection().delete_one({"_id": ObjectId(chat_id)})
        return result.deleted_count == 1

    async def delete_all_chats(self) -> int:
        """Delete all chat conversations."""
        result = await self._collection().delete_many({})
        return result.deleted_count

    async def soft_delete_message(self, chat_id: str, msg_index: int) -> bool:
        """Mark a message as deleted at a specific index."""
        if not ObjectId.is_valid(chat_id):
            return False

        chat = await self.get_chat(chat_id)
        if not chat:
            return False

        messages = chat.get("messages", [])
        if msg_index < 0 or msg_index >= len(messages):
            return False

        update_key = f"messages.{msg_index}.deleted"
        await self._collection().update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {update_key: True, "updated_at": datetime.now()}}
        )
        return True

    async def toggle_like_message(self, chat_id: str, msg_index: int) -> Optional[bool]:
        """Toggle the liked status of a message at a specific index."""
        if not ObjectId.is_valid(chat_id):
            return None

        chat = await self.get_chat(chat_id)
        if not chat:
            return None

        messages = chat.get("messages", [])
        if msg_index < 0 or msg_index >= len(messages):
            return None

        current_liked = messages[msg_index].get("liked", False)
        new_liked = not current_liked
        update_key = f"messages.{msg_index}.liked"

        await self._collection().update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {update_key: new_liked, "updated_at": datetime.now()}}
        )
        return new_liked

    # --- Conversation Memory Methods (used during chat generation) ---

    async def get_history(self, chat_id: str, max_turns: int = 5) -> List[Dict[str, Any]]:
        """Retrieve recent non-deleted conversation turns formatted for LLM context."""
        chat = await self.get_chat(chat_id)
        if not chat or "messages" not in chat:
            return []

        stored = chat["messages"]
        if max_turns > 0 and len(stored) > max_turns * 2:
            stored = stored[-(max_turns * 2):]

        history = []
        for msg in stored:
            if msg.get("deleted"):
                continue
            history.append({
                "role": msg["role"],
                "content": msg["content"],
                "emotion": msg.get("emotion")
            })
        return history

    async def add_turn(
        self,
        chat_id: str,
        user_text: str,
        final_emotion: str,
        mental_state: str,
        assistant_response: str
    ) -> str:
        """Append user and assistant turns to the chat history. Creates document if ephemeral."""
        now = datetime.now()
        user_msg = {
            "role": "user",
            "content": user_text,
            "emotion": final_emotion,
            "mental_state": mental_state,
            "timestamp": now
        }
        assistant_msg = {
            "role": "assistant",
            "content": assistant_response,
            "timestamp": now
        }

        if not ObjectId.is_valid(chat_id):
            title = user_text[:30].strip() or "New Chat"
            chat_doc = {
                "title": title,
                "created_at": now,
                "updated_at": now,
                "messages": [user_msg, assistant_msg]
            }
            res = await self._collection().insert_one(chat_doc)
            return str(res.inserted_id)

        await self._collection().update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": now}
            }
        )
        return chat_id

    async def clear_session(self, chat_id: str):
        """Clear all messages in a chat."""
        if not ObjectId.is_valid(chat_id):
            return
        await self._collection().update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"messages": [], "updated_at": datetime.now()}}
        )

    async def create_session(self, title: str = "New Chat") -> str:
        """Alias for create_chat returning session ID string (backward compatibility)."""
        chat = await self.create_chat(title=title)
        return str(chat["_id"])

    async def remove_session(self, chat_id: str) -> bool:
        """Alias for delete_chat (backward compatibility)."""
        return await self.delete_chat(chat_id)

    @staticmethod
    def should_clear(user_text: str) -> bool:
        """Check if user query is a request to clear conversation history."""
        clear_commands = ["clear", "reset", "start over", "new conversation"]
        return user_text.lower().strip() in clear_commands


chat_service = ChatService()
