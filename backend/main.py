# FastAPI Backend Entry Point
# Emotion-Aware AI Healthcare Assistant

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import subprocess
import sys
import os
import time
import signal
import atexit
import logging

from api.websocket import router as websocket_router
from api.rest import router as rest_router
from api.chat import router as chat_router
from models.db import db
from config import LLAMA_SERVER_URL, GGUF_MODEL_PATH

logger = logging.getLogger(__name__)

# Global reference to the llama-server process
llama_process = None

def start_llama_server():
    """Start llama-server as a subprocess"""
    global llama_process
    
    # Resolve paths relative to the backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)
    
    server_exe = os.path.join(project_root, "llama.cpp", "build", "bin", "Release", "llama-server.exe")
    model_path = os.path.join(project_root, "model", "ministral3b-q4.gguf")
    
    if not os.path.exists(server_exe):
        logger.error(f"llama-server not found at: {server_exe}")
        return False
    
    if not os.path.exists(model_path):
        logger.error(f"GGUF model not found at: {model_path}")
        return False
    
    # Extract port from LLAMA_SERVER_URL
    port = LLAMA_SERVER_URL.split(":")[-1]
    
    cmd = [server_exe, "-m", model_path, "-c", "2048", "--port", port, "--parallel", "1"]
    
    logger.info(f"Starting llama-server: {' '.join(cmd)}")
    
    try:
        llama_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
        
        # Wait a few seconds for the server to load the model
        time.sleep(3)
        
        if llama_process.poll() is not None:
            logger.error("llama-server failed to start")
            return False
        
        logger.info(f"llama-server started (PID: {llama_process.pid}) on port {port}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to start llama-server: {e}")
        return False

def stop_llama_server():
    """Stop the llama-server subprocess"""
    global llama_process
    if llama_process and llama_process.poll() is None:
        logger.info("Stopping llama-server...")
        llama_process.terminate()
        try:
            llama_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            llama_process.kill()
        logger.info("llama-server stopped")

# Register cleanup on exit
atexit.register(stop_llama_server)

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
    stop_llama_server()
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
    # Start llama-server first
    print("=" * 50)
    print("Starting llama-server (Ministral 3B)...")
    print("=" * 50)
    
    if start_llama_server():
        print("✓ llama-server is running")
    else:
        print("✗ llama-server failed to start — LLM responses will not work")
    
    print("=" * 50)
    print("Starting FastAPI backend...")
    print("=" * 50)
    
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
