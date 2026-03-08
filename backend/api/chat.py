from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List
from models.db import db
from models.chat import Chat, CreateChatRequest, UpdateChatRequest
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/chats", tags=["chats"])

def get_collection():
    return db.get_collection("chats")

@router.post("", response_description="Create a new chat", response_model=Chat)
async def create_chat(request: CreateChatRequest = Body(...)):
    chat = {
        "title": request.title,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "messages": []
    }
    new_chat = await get_collection().insert_one(chat)
    created_chat = await get_collection().find_one({"_id": new_chat.inserted_id})
    return created_chat

@router.get("", response_description="List all chats", response_model=List[Chat])
async def list_chats():
    chats = await get_collection().find().sort("updated_at", -1).to_list(100)
    return chats

@router.get("/{id}", response_description="Get a single chat", response_model=Chat)
async def show_chat(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
        
    chat = await get_collection().find_one({"_id": ObjectId(id)})
    if chat is not None:
        return chat
    
    raise HTTPException(status_code=404, detail=f"Chat {id} not found")

@router.put("/{id}", response_description="Update a chat", response_model=Chat)
async def update_chat(id: str, request: UpdateChatRequest = Body(...)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
        
    chat = {k: v for k, v in request.model_dump(exclude_unset=True).items()}
    
    if len(chat) >= 1:
        update_result = await get_collection().update_one(
            {"_id": ObjectId(id)}, {"$set": chat}
        )
        
        if update_result.modified_count == 1:
            if (
                updated_chat := await get_collection().find_one({"_id": ObjectId(id)})
            ) is not None:
                return updated_chat
                
    if (existing_chat := await get_collection().find_one({"_id": ObjectId(id)})) is not None:
        return existing_chat
        
    raise HTTPException(status_code=404, detail=f"Chat {id} not found")

@router.delete("/all", response_description="Delete all chats")
async def delete_all_chats():
    result = await get_collection().delete_many({})
    return {"message": f"Deleted {result.deleted_count} chats"}

@router.delete("/{id}", response_description="Delete a chat")
async def delete_chat(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
        
    delete_result = await get_collection().delete_one({"_id": ObjectId(id)})
    
    if delete_result.deleted_count == 1:
        return {"message": "Chat deleted"}
        
    raise HTTPException(status_code=404, detail=f"Chat {id} not found")

@router.delete("/{id}/messages/{msg_index}", response_description="Soft-delete a message")
async def soft_delete_message(id: str, msg_index: int):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    
    chat = await get_collection().find_one({"_id": ObjectId(id)})
    if not chat:
        raise HTTPException(status_code=404, detail=f"Chat {id} not found")
    
    messages = chat.get("messages", [])
    if msg_index < 0 or msg_index >= len(messages):
        raise HTTPException(status_code=400, detail="Invalid message index")
    
    # Soft-delete: set deleted flag on the message
    update_key = f"messages.{msg_index}.deleted"
    await get_collection().update_one(
        {"_id": ObjectId(id)},
        {"$set": {update_key: True, "updated_at": datetime.now()}}
    )
    
    return {"message": "Message deleted"}

@router.put("/{id}/messages/{msg_index}/like", response_description="Toggle like on a message")
async def toggle_like_message(id: str, msg_index: int):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    
    chat = await get_collection().find_one({"_id": ObjectId(id)})
    if not chat:
        raise HTTPException(status_code=404, detail=f"Chat {id} not found")
    
    messages = chat.get("messages", [])
    if msg_index < 0 or msg_index >= len(messages):
        raise HTTPException(status_code=400, detail="Invalid message index")
    
    # Toggle liked flag
    current_liked = messages[msg_index].get("liked", False)
    update_key = f"messages.{msg_index}.liked"
    await get_collection().update_one(
        {"_id": ObjectId(id)},
        {"$set": {update_key: not current_liked, "updated_at": datetime.now()}}
    )
    
    return {"message": "Message liked" if not current_liked else "Message unliked", "liked": not current_liked}
