"""
WhatsApp API Service
Handles sending messages via the WhatsApp Business API.
"""

import os
import logging
import httpx

logger = logging.getLogger(__name__)

# WhatsApp API configuration
WHATSAPP_API_URL = "https://graph.facebook.com/v21.0"


async def send_whatsapp_message(to: str, message: str) -> dict:
    """
    Send a text message to a WhatsApp user.
    
    Args:
        to: Recipient phone number
        message: Text message to send
        
    Returns:
        WhatsApp API response
    """
    whatsapp_token = os.getenv("WHATSAPP_TOKEN")
    phone_number_id = os.getenv("PHONE_NUMBER_ID")
    
    if not whatsapp_token or not phone_number_id:
        logger.error("Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID environment variables")
        raise ValueError("WhatsApp API credentials not configured")
    
    url = f"{WHATSAPP_API_URL}/{phone_number_id}/messages"
    
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message},
    }
    
    headers = {
        "Authorization": f"Bearer {whatsapp_token}",
        "Content-Type": "application/json",
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            logger.info(f"Message sent successfully: {data}")
            return data
    except httpx.HTTPError as e:
        logger.error(f"Error sending message: {e}")
        raise
