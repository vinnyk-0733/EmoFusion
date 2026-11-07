"""
FastAPI Application Factory
Configures middlewares, lifecycle events, and registers domain module routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.database import db
from app.modules.chat import chat_router, websocket_router
from app.modules.emotion import emotion_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown."""
    logger.info("Initializing application resources...")
    db.connect()
    yield
    logger.info("Closing application resources...")
    db.close()


def create_app() -> FastAPI:
    """Build and configure the FastAPI application instance."""
    app = FastAPI(
        title="Emotion-Aware AI Healthcare Assistant",
        description="Modular Monolithic Multimodal Emotion Recognition & Conversational AI API",
        version="2.0.0",
        lifespan=lifespan
    )

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex="https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Domain Module Routers
    app.include_router(websocket_router)
    app.include_router(chat_router)
    app.include_router(emotion_router)

    @app.get("/")
    async def root():
        return {
            "message": "Emotion-Aware AI Healthcare Assistant API",
            "architecture": "Modular Monolithic",
            "version": "2.0.0",
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

    return app


app = create_app()

