# FastAPI Backend Entry Point
# Emotion-Aware AI Healthcare Assistant

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.websocket import router as websocket_router
from api.rest import router as rest_router
from api.chat import router as chat_router
from models.db import db

app = FastAPI(
    title="Emotion-Aware AI Healthcare Assistant",
    description="Multimodal emotion recognition with context-aware LLM responses",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    db.connect()

@app.on_event("shutdown")
async def shutdown_db_client():
    db.close()

# Include Routers
app.include_router(websocket_router)
app.include_router(rest_router)
app.include_router(chat_router)

@app.get("/")
async def root():
    return {
        "message": "Emotion-Aware AI Healthcare Assistant API",
        "status": "running",
        "endpoints": {
            "websocket": "/ws/chat",
            "facial_emotion": "/api/emotion/facial",
            "text_emotion": "/api/emotion/text",
            "chats": "/api/chats",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
