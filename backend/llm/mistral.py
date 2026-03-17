# LLM Integration via llama.cpp server (OpenAI-compatible API)
# Handles text generation with Ministral 3B GGUF

import aiohttp
from typing import AsyncGenerator, Optional
import logging
import json
import asyncio

from config import LLAMA_SERVER_URL

logger = logging.getLogger(__name__)

async def generate_response(
    system_prompt: str,
    user_prompt: str,
    stream: bool = True,
    stop_event: Optional[asyncio.Event] = None
) -> AsyncGenerator[str, None]:
    """
    Generate response from llama-server (streaming, OpenAI-compatible)
    
    Args:
        system_prompt: System prompt with context
        user_prompt: User message with history
        stream: Whether to stream the response
        stop_event: Event to signal generation stop
    
    Yields:
        Response text chunks
    """
    url = f"{LLAMA_SERVER_URL}/v1/chat/completions"
    
    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": stream,
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 256
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"llama-server error: {response.status} - {error_text}")
                    return
                
                if stream:
                    async for line in response.content:
                        if stop_event and stop_event.is_set():
                            logger.info("Generation interrupted by user")
                            break
                        
                        if not line:
                            continue
                        
                        decoded = line.decode('utf-8').strip()
                        
                        # SSE format: lines start with "data: "
                        if not decoded.startswith("data: "):
                            continue
                        
                        data_str = decoded[6:]  # strip "data: " prefix
                        
                        if data_str == "[DONE]":
                            break
                        
                        try:
                            data = json.loads(data_str)
                            choices = data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
                else:
                    data = await response.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        yield content
                            
    except aiohttp.ClientError as e:
        logger.error(f"Connection error to llama-server: {e}")
        yield "I'm having trouble connecting to the language model. Please ensure llama-server is running."
    except Exception as e:
        logger.error(f"Unexpected error in generate_response: {e}")
        yield "An unexpected error occurred. Please try again."

async def generate_response_sync(
    system_prompt: str,
    user_prompt: str
) -> str:
    """
    Generate complete response from llama-server (non-streaming)
    """
    url = f"{LLAMA_SERVER_URL}/v1/chat/completions"
    
    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 150
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"llama-server error: {response.status} - {error_text}")
                    return "I apologize, but I'm having trouble generating a response right now."
                
                data = await response.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
                return ""
                
    except Exception as e:
        logger.error(f"Error in generate_response_sync: {e}")
        return "An error occurred while generating the response."

async def check_llm_health() -> bool:
    """Check if llama-server is running and accessible"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{LLAMA_SERVER_URL}/health") as response:
                return response.status == 200
    except:
        return False
