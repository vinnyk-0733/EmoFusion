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

@router.delete("/{id}", response_description="Delete a chat")
async def delete_chat(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
        
    delete_result = await get_collection().delete_one({"_id": ObjectId(id)})
    
    if delete_result.deleted_count == 1:
        return {"message": "Chat deleted"}
        
    raise HTTPException(status_code=404, detail=f"Chat {id} not found")
