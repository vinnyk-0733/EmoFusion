"""
Chat Module Schemas
Pydantic data models for chats, messages, and API requests.
"""

from typing import List, Optional, Any, Callable
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema


class PyObjectId(str):
    """Custom Pydantic field type for MongoDB ObjectId serialization."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Callable[[Any], core_schema.CoreSchema]
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.str_schema(),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId string")
        return ObjectId(v)


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    emotion: Optional[str] = None
    mental_state: Optional[str] = None
    deleted: Optional[bool] = None
    liked: Optional[bool] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class Chat(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str = "New Chat"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    messages: List[Message] = []

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class CreateChatRequest(BaseModel):
    title: Optional[str] = "New Chat"


class UpdateChatRequest(BaseModel):
    title: Optional[str] = None

