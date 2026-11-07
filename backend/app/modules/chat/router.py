"""
Chat REST API Endpoints
Provides CRUD operations, soft deletion, and message likes.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Body
from bson import ObjectId

from app.modules.chat.schemas import Chat, CreateChatRequest, UpdateChatRequest
from app.modules.chat.service import chat_service

router = APIRouter(prefix="/api/chats", tags=["chats"])


@router.post("", response_description="Create a new chat", response_model=Chat)
async def create_chat_endpoint(request: CreateChatRequest = Body(...)):
    """Create a new chat conversation."""
    created = await chat_service.create_chat(title=request.title or "New Chat")
    return created


@router.get("", response_description="List all chats", response_model=List[Chat])
async def list_chats_endpoint():
    """List recent chat conversations."""
    return await chat_service.list_chats()


@router.get("/{id}", response_description="Get a single chat", response_model=Chat)
async def get_chat_endpoint(id: str):
    """Retrieve full details of a single chat."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    chat = await chat_service.get_chat(id)
    if not chat:
        raise HTTPException(status_code=404, detail=f"Chat {id} not found")
    return chat


@router.put("/{id}", response_description="Update a chat", response_model=Chat)
async def update_chat_endpoint(id: str, request: UpdateChatRequest = Body(...)):
    """Update chat title."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    if request.title:
        updated = await chat_service.update_chat_title(id, request.title)
        if updated:
            return updated

    chat = await chat_service.get_chat(id)
    if not chat:
        raise HTTPException(status_code=404, detail=f"Chat {id} not found")
    return chat


@router.delete("/all", response_description="Delete all chats")
async def delete_all_chats_endpoint():
    """Delete all conversations."""
    deleted_count = await chat_service.delete_all_chats()
    return {"message": f"Deleted {deleted_count} chats"}


@router.delete("/{id}", response_description="Delete a chat")
async def delete_chat_endpoint(id: str):
    """Delete a single chat conversation."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    success = await chat_service.delete_chat(id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Chat {id} not found")
    return {"message": "Chat deleted"}


@router.delete("/{id}/messages/{msg_index}", response_description="Soft-delete a message")
async def soft_delete_message_endpoint(id: str, msg_index: int):
    """Soft-delete a specific message in a chat."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    success = await chat_service.soft_delete_message(id, msg_index)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete message. Check chat ID and message index.")
    return {"message": "Message deleted"}


@router.put("/{id}/messages/{msg_index}/like", response_description="Toggle like on a message")
async def toggle_like_message_endpoint(id: str, msg_index: int):
    """Toggle the liked status of a message."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    new_liked = await chat_service.toggle_like_message(id, msg_index)
    if new_liked is None:
        raise HTTPException(status_code=400, detail="Could not toggle like. Check chat ID and message index.")
    return {
        "message": "Message liked" if new_liked else "Message unliked",
        "liked": new_liked
    }

