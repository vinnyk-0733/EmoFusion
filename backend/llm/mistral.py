# Mistral LLM Integration via Ollama
# Handles text generation with Mistral 7B

import aiohttp
from typing import AsyncGenerator, Optional
import logging
import json
import asyncio

from config import OLLAMA_BASE_URL, OLLAMA_MODEL

logger = logging.getLogger(__name__)

async def generate_response(
    system_prompt: str,
    user_prompt: str,
    stream: bool = True,
    stop_event: Optional[asyncio.Event] = None
) -> AsyncGenerator[str, None]:
    """
    Generate response from Mistral via Ollama (streaming)
    
    Args:
        system_prompt: System prompt with context
        user_prompt: User message with history
        stream: Whether to stream the response
    
    Yields:
        Response text chunks
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": user_prompt,
        "system": system_prompt,
        "stream": stream,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_predict": 500
        }
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Ollama error: {response.status} - {error_text}")
                    
                    if "CUDA error" in error_text:
                        # Suppress error message in chat as requested
                        logger.error("GPU Memory Error detected (suppressed in chat)")
                    else:
                        logger.error("General Ollama Error (suppressed in chat)")
                    return
                
                async for line in response.content:
                    if stop_event and stop_event.is_set():
                        logger.info("Generation interrupted by user")
                        break
                        
                    if line:
                        try:
                            data = json.loads(line.decode('utf-8'))
                            if 'response' in data:
                                yield data['response']
                            if data.get('done', False):
                                break
                        except json.JSONDecodeError:
                            continue
                            
    except aiohttp.ClientError as e:
        logger.error(f"Connection error to Ollama: {e}")
        yield "I'm having trouble connecting to my language model. Please ensure Ollama is running."
    except Exception as e:
        logger.error(f"Unexpected error in generate_response: {e}")
        yield "An unexpected error occurred. Please try again."

async def generate_response_sync(
    system_prompt: str,
    user_prompt: str
) -> str:
    """
    Generate complete response from Mistral via Ollama (non-streaming)
    
    Args:
        system_prompt: System prompt with context
        user_prompt: User message with history
    
    Returns:
        Complete response text
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": user_prompt,
        "system": system_prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_predict": 500
        }
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Ollama error: {response.status} - {error_text}")
                    return "I apologize, but I'm having trouble generating a response right now."
                
                data = await response.json()
                return data.get('response', '')
                
    except Exception as e:
        logger.error(f"Error in generate_response_sync: {e}")
        return "An error occurred while generating the response."

async def check_ollama_health() -> bool:
    """Check if Ollama is running and accessible"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{OLLAMA_BASE_URL}/api/tags") as response:
                return response.status == 200
    except:
        return False
