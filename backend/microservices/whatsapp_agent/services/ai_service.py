"""
AI Service
Handles chat generation by calling external TunCHAT model API (Colab/remote server).
"""

import os
import logging
from typing import Optional, Dict, Any

import httpx

from .conversation_service import get_history, format_history_for_model

logger = logging.getLogger(__name__)

# Colab/remote model endpoint - set via environment variable
# Example: https://xxxx-xx-xxx-xxx-xxx.trycloudflare.com/chat
MODEL_ENDPOINT = os.getenv("MODEL_ENDPOINT", "http://localhost:8010/chat")


async def query_model(
    message: str,
    language: str = "arabic",
    context: Optional[str] = None,
    user_phone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Query the remote TunCHAT model API.
    
    Args:
        message: User's message
        language: 'french' or 'arabic'
        context: Optional context from tool execution
        user_phone: User's phone for conversation history
        
    Returns:
        Model response dict with 'reply' key
    """
    # Get conversation history
    history = get_history(user_phone, 6) if user_phone else []
    history_text = format_history_for_model(history)
    
    # Build the prompt
    full_prompt = message
    
    if context:
        full_prompt = (
            f"{context}\n\n"
            f'User message: "{message}"\n\n'
            f"Provide a brief, professional response."
        )
    
    # Add conversation history if available
    if history_text:
        full_prompt = f"{history_text}\n\nCurrent message: {full_prompt}"
    
    # Add language instruction
    if language == "french":
        language_instruction = (
            "\n\nIMPORTANT: Respond in professional French."
        )
    else:
        language_instruction = (
            "\n\nIMPORTANT: Respond in professional Arabic (Modern Standard Arabic)."
        )
    
    full_prompt += language_instruction
    
    logger.info(f"📤 Sending request to model endpoint: {MODEL_ENDPOINT}")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                MODEL_ENDPOINT,
                json={"message": full_prompt},
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"✅ Model response received")
            return data
            
    except httpx.TimeoutException:
        logger.error("❌ Model request timed out (>120s)")
        fallback = (
            "Désolé, le temps de réponse a été trop long. Veuillez réessayer."
            if language == "french"
            else "عذراً، استغرق الرد وقتاً طويلاً. يرجى المحاولة مرة أخرى."
        )
        return {"reply": fallback}
        
    except httpx.HTTPError as e:
        logger.error(f"❌ Error querying model: {e}")
        fallback = (
            "Bonjour! Le service AI est temporairement indisponible. Veuillez réessayer plus tard."
            if language == "french"
            else "مرحباً! خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة لاحقاً."
        )
        return {"reply": fallback}
