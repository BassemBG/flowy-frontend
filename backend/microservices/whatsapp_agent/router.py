"""
WhatsApp Agent Router
Webhook endpoints for WhatsApp Business API integration.
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Request, HTTPException, Query

from services.whatsapp_service import send_whatsapp_message
from services.transcription_service import download_whatsapp_media, transcribe_audio
from services.conversation_service import add_to_history
from services.tool_service import detect_language, extract_verification_data, detect_tool_needed, execute_local_tool
from services.ai_service import query_model
from services.analytics_service import (
    track_message_received, track_message_sent, track_tool_usage, get_analytics,
    is_agent_active, set_agent_active, get_agent_status, get_offline_message
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Session storage for pending verifications (in production, use Redis or database)
pending_verifications: Dict[str, Dict[str, Any]] = {}

# Message deduplication - store processed message IDs
processed_messages: set = set()
MAX_PROCESSED_MESSAGES = 1000


def cleanup_processed_messages():
    """Clean up old message IDs if cache is too large."""
    global processed_messages
    if len(processed_messages) > MAX_PROCESSED_MESSAGES:
        processed_messages.clear()
        logger.info("🧹 Cleared processed messages cache")


@router.get("/")
def get_whatsapp_agent():
    """Root endpoint for WhatsApp Agent microservice."""
    return {"message": "WhatsApp Agent Module"}


@router.get("/analytics")
def get_whatsapp_analytics():
    """Get analytics data for the dashboard."""
    analytics = get_analytics()
    analytics["is_agent_active"] = is_agent_active()
    return analytics


@router.get("/status")
def get_status():
    """Get agent active status."""
    return get_agent_status()


@router.post("/status")
async def update_status(request: Request):
    """Update agent active status."""
    body = await request.json()
    active = body.get("is_active", True)
    return set_agent_active(active)


@router.get("/webhook")
async def verify_webhook(
    request: Request,
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
):
    """
    WhatsApp webhook verification endpoint.
    Called by WhatsApp to verify webhook URL.
    """
    verify_token = os.getenv("VERIFY_TOKEN")
    
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        logger.info("WEBHOOK VERIFIED")
        return int(hub_challenge) if hub_challenge and hub_challenge.isdigit() else hub_challenge
    
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def handle_webhook(request: Request):
    """
    Handle incoming WhatsApp webhook events.
    Processes text and voice messages.
    """
    timestamp = datetime.now().isoformat()
    logger.info(f"\n\nWebhook received {timestamp}\n")
    
    try:
        body = await request.json()
        logger.info(f"Webhook body: {body}")
        
        # Check if this is a message notification
        if not (
            body.get("entry") and
            body["entry"][0].get("changes") and
            body["entry"][0]["changes"][0].get("value", {}).get("messages")
        ):
            return {"status": "ok"}
        
        message = body["entry"][0]["changes"][0]["value"]["messages"][0]
        message_id = message.get("id")
        from_number = message.get("from")
        
        # Check if we've already processed this message
        if message_id in processed_messages:
            logger.info(f"⏭️ Skipping duplicate message: {message_id}")
            return {"status": "ok"}
        
        # Mark this message as processed
        processed_messages.add(message_id)
        cleanup_processed_messages()
        logger.info(f"✅ Processing new message: {message_id}")
        
        message_text = message.get("text", {}).get("body")
        audio_message = message.get("audio")
        voice_message = message.get("voice")
        
        # Handle voice/audio messages
        if audio_message or voice_message:
            media_id = audio_message.get("id") if audio_message else voice_message.get("id")
            logger.info(f"\n🎤 Received voice message from {from_number}, Media ID: {media_id}")
            
            try:
                # Download audio
                logger.info("Downloading audio...")
                audio_file_path = await download_whatsapp_media(media_id)
                
                # Transcribe audio using simple /transcribe endpoint
                logger.info("Transcribing audio with /transcribe endpoint...")
                transcription_result = await transcribe_audio(audio_file_path, use_simple_transcribe=True)
                logger.info(f"Transcription result: {transcription_result}")
                
                if transcription_result.get("text"):
                    message_text = transcription_result["text"]
                    logger.info(f"✅ Transcribed: {message_text}")
                else:
                    logger.error("❌ Transcription failed")
                    error_msg = (
                        "Désolé, je n'ai pas pu comprendre le message vocal. Veuillez réessayer."
                        if detect_language(message_text or "error") == "french"
                        else "عذراً، لم أتمكن من فهم الرسالة الصوتية. يرجى المحاولة مرة أخرى."
                    )
                    await send_whatsapp_message(from_number, error_msg)
                    return {"status": "ok"}
                    
            except Exception as e:
                logger.error(f"Error processing voice message: {e}")
                await send_whatsapp_message(
                    from_number,
                    "Sorry, there was an error processing your voice message. Please try again."
                )
                return {"status": "ok"}
        
        if message_text:
            logger.info(f"\n📝 Received message from {from_number}: {message_text}")
            
            # Detect language
            language = detect_language(message_text)
            logger.info(f"Detected language: {language}")
            
            # Track analytics
            track_message_received(from_number, language)
            
            # Check if agent is active
            if not is_agent_active():
                logger.info("🔴 Agent is inactive, sending offline message")
                offline_msg = get_offline_message(language)
                await send_whatsapp_message(from_number, offline_msg)
                track_message_sent(from_number)
                return {"status": "ok"}
            
            # Add user message to history
            add_to_history(from_number, "user", message_text)
            
            # Check if user has pending verification
            has_pending_verification = from_number in pending_verifications
            
            # Extract verification data (name or CIN)
            verification_data = extract_verification_data(message_text)
            
            # Check if we need to use local tools
            tool_info = detect_tool_needed(message_text)
            
            final_response = None
            
            if tool_info:
                # Execute local tool with verification
                logger.info(f"Executing local tool: {tool_info['tool']}")
                track_tool_usage(tool_info['tool'])
                tool_result = execute_local_tool(
                    tool_info,
                    language,
                    verification_data,
                    from_number
                )
                
                if tool_result.get("needsVerification"):
                    # Store that this user needs verification
                    pending_verifications[from_number] = {
                        "tool": tool_info["tool"],
                        "timestamp": datetime.now().timestamp(),
                    }
                    final_response = tool_result["message"]
                elif tool_result.get("verified"):
                    # Clear pending verification
                    pending_verifications.pop(from_number, None)
                    final_response = tool_result["message"]
                else:
                    final_response = tool_result.get("message") or str(tool_result)
                    
            elif has_pending_verification and verification_data:
                # User provided verification data after being asked
                pending_info = pending_verifications[from_number]
                logger.info(f"Processing verification for pending request: {pending_info['tool']}")
                
                tool_result = execute_local_tool(
                    pending_info,
                    language,
                    verification_data,
                    from_number
                )
                
                if tool_result.get("verified"):
                    pending_verifications.pop(from_number, None)
                    final_response = tool_result["message"]
                else:
                    if language == "french":
                        final_response = (
                            "❌ Vérification échouée. Le nom ou CIN ne correspond pas à nos dossiers. "
                            "Veuillez réessayer."
                        )
                    else:
                        final_response = (
                            "❌ فشل التحقق. الاسم أو رقم البطاقة لا يطابق سجلاتنا. "
                            "يرجى المحاولة مرة أخرى."
                        )
            else:
                # No tool needed, just query the AI model
                logger.info("Querying AI model...")
                ai_response = await query_model(message_text, language, None, from_number)
                final_response = ai_response.get("reply", "")
            
            logger.info(f"Final Response: {final_response}")
            
            # Add assistant response to history
            add_to_history(from_number, "assistant", final_response)
            
            # Send the response back to WhatsApp
            logger.info("Sending response to WhatsApp...")
            await send_whatsapp_message(from_number, final_response)
            track_message_sent(from_number)
            logger.info("Response sent successfully!")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return {"status": "ok"}  # Still return 200 to avoid webhook retry
