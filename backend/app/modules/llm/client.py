"""
Generative AI Client via LangChain + Google Gemini API
Handles asynchronous streaming and synchronous completion generation.
"""

import asyncio
import logging
from typing import AsyncGenerator, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings

logger = logging.getLogger(__name__)

_llm: Optional[ChatGoogleGenerativeAI] = None


def _extract_text(content) -> str:
    """Extract plain text from LangChain message content (string or list of parts)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                parts.append(part["text"])
        return "".join(parts)
    return str(content) if content else ""


def get_llm() -> ChatGoogleGenerativeAI:
    """Get or initialize the LangChain Gemini LLM client."""
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            max_output_tokens=256,
        )
    return _llm


async def generate_response(
    system_prompt: str,
    user_prompt: str,
    stream: bool = True,
    stop_event: Optional[asyncio.Event] = None
) -> AsyncGenerator[str, None]:
    """Generate response chunks from Gemini API asynchronously."""
    llm = get_llm()
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    try:
        if stream:
            async for chunk in llm.astream(messages):
                if stop_event and stop_event.is_set():
                    logger.info("Generation interrupted by user")
                    break

                text = _extract_text(chunk.content) if hasattr(chunk, "content") else ""
                if text:
                    yield text
        else:
            response = await llm.ainvoke(messages)
            text = _extract_text(response.content) if hasattr(response, "content") else ""
            if text:
                yield text
    except Exception as e:
        logger.error(f"Gemini API error in generate_response: {e}")
        yield "I'm having trouble connecting to the AI service. Please check your API key and try again."


async def generate_response_sync(
    system_prompt: str,
    user_prompt: str
) -> str:
    """Generate complete non-streaming response from Gemini API."""
    llm = get_llm()
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    try:
        response = await llm.ainvoke(messages)
        return _extract_text(response.content) if hasattr(response, "content") else ""
    except Exception as e:
        logger.error(f"Gemini API error in generate_response_sync: {e}")
        return "An error occurred while generating the response."


async def check_llm_health() -> bool:
    """Check if the Gemini API service is operational."""
    try:
        llm = get_llm()
        response = await llm.ainvoke([HumanMessage(content="ping")])
        return bool(response.content)
    except Exception:
        return False

