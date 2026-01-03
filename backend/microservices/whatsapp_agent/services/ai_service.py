"""
AI Service
Handles chat generation using local TunCHAT model.
"""

import logging
from typing import Optional, Dict, Any

from .conversation_service import get_history, format_history_for_model

logger = logging.getLogger(__name__)


async def query_model(
    message: str,
    language: str = "arabic",
    context: Optional[str] = None,
    user_phone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Query the AI model with a message.
    
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
    
    # Generate response - for now return a simple acknowledgment
    # TODO: Integrate with actual AI model when available
    try:
        # Fallback response when no AI model is configured
        if language == "french":
            reply = f"Message reçu: '{message}'. Le service AI sera bientôt disponible."
        else:
            reply = f"تم استلام الرسالة: '{message}'. خدمة الذكاء الاصطناعي ستكون متاحة قريباً."
        
        return {"reply": reply}
        
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        fallback = (
            "Bonjour! Le service AI est temporairement indisponible. Veuillez réessayer plus tard."
            if language == "french"
            else "مرحباً! خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة لاحقاً."
        )
        return {"reply": fallback}
