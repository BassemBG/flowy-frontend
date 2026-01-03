"""
Conversation Service
Manages conversation history for users.
"""

import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Conversation history storage (phone -> array of messages)
conversation_history: Dict[str, List[Dict[str, Any]]] = {}
MAX_HISTORY_LENGTH = 10  # Keep last 10 messages per user


def add_to_history(phone: str, role: str, content: str) -> None:
    """
    Add a message to the conversation history.
    
    Args:
        phone: User's phone number
        role: Either 'user' or 'assistant'
        content: Message content
    """
    if phone not in conversation_history:
        conversation_history[phone] = []
    
    history = conversation_history[phone]
    history.append({
        "role": role,
        "content": content,
        "timestamp": datetime.now().timestamp()
    })
    
    # Keep only last N messages
    if len(history) > MAX_HISTORY_LENGTH:
        conversation_history[phone] = history[-MAX_HISTORY_LENGTH:]


def get_history(phone: str, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Get conversation history for a user.
    
    Args:
        phone: User's phone number
        limit: Maximum number of messages to return (default: 6 = 3 exchanges)
        
    Returns:
        List of message dictionaries
    """
    if phone not in conversation_history:
        return []
    
    history = conversation_history[phone]
    return history[-limit:]


def format_history_for_model(history: List[Dict[str, Any]]) -> str:
    """
    Format conversation history for the AI model prompt.
    
    Args:
        history: List of message dictionaries
        
    Returns:
        Formatted string for model context
    """
    if not history:
        return ""
    
    formatted = "\n\nConversation History:\n"
    for msg in history:
        role_name = "User" if msg["role"] == "user" else "Assistant"
        formatted += f"{role_name}: {msg['content']}\n"
    
    return formatted


def clear_history(phone: str) -> None:
    """Clear conversation history for a user."""
    if phone in conversation_history:
        del conversation_history[phone]
