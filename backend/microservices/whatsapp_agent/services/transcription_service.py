"""
Transcription Service
Handles downloading WhatsApp media and transcribing audio.
"""

import os
import logging
import httpx
import aiofiles
from pathlib import Path

logger = logging.getLogger(__name__)

# WhatsApp API configuration
WHATSAPP_API_URL = "https://graph.facebook.com/v21.0"


async def download_whatsapp_media(media_id: str) -> str:
    """
    Download media file from WhatsApp.
    
    Args:
        media_id: WhatsApp media ID
        
    Returns:
        Path to the downloaded temporary file
    """
    whatsapp_token = os.getenv("WHATSAPP_TOKEN")
    
    if not whatsapp_token:
        raise ValueError("WHATSAPP_TOKEN not configured")
    
    headers = {"Authorization": f"Bearer {whatsapp_token}"}
    
    logger.info(f"📥 Starting download for media ID: {media_id}")
    
    async with httpx.AsyncClient() as client:
        # Step 1: Get media URL
        media_url_response = await client.get(
            f"{WHATSAPP_API_URL}/{media_id}",
            headers=headers
        )
        media_url_response.raise_for_status()
        media_url = media_url_response.json().get("url")
        
        logger.info(f"✅ Media URL retrieved: {media_url}")
        
        # Step 2: Download media file
        logger.info("⬇️ Downloading media file...")
        media_response = await client.get(media_url, headers=headers)
        media_response.raise_for_status()
        
        content = media_response.content
        logger.info(f"✅ Downloaded {len(content)} bytes")
        
        # Step 3: Save to temporary file
        temp_dir = Path(__file__).parent.parent / "temp"
        temp_dir.mkdir(exist_ok=True)
        
        temp_file_path = temp_dir / f"{media_id}.ogg"
        
        async with aiofiles.open(temp_file_path, "wb") as f:
            await f.write(content)
        
        logger.info(f"✅ Media saved to: {temp_file_path}")
        
        return str(temp_file_path)


async def transcribe_audio(audio_file_path: str, use_simple_transcribe: bool = False) -> dict:
    """
    Transcribe audio file using STT endpoint.
    
    Args:
        audio_file_path: Path to the audio file
        use_simple_transcribe: If True, use /transcribe endpoint, else /voice-chat
        
    Returns:
        Transcription result from the STT service
    """
    model_endpoint = os.getenv("MODEL_ENDPOINT", "http://host.docker.internal:8000/chat")
    stt_endpoint = os.getenv("STT_ENDPOINT", model_endpoint.replace("/chat", "/voice-chat"))
    
    if use_simple_transcribe:
        endpoint = stt_endpoint.replace("/voice-chat", "/transcribe")
    else:
        endpoint = stt_endpoint
    
    logger.info(f"📤 Sending audio file to: {endpoint}")
    logger.info(f"📁 File path: {audio_file_path}")
    logger.info(f"⚙️ Mode: {'Simple transcribe' if use_simple_transcribe else 'Full voice-chat'}")
    
    # Check if file exists
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
    
    file_size = os.path.getsize(audio_file_path)
    logger.info(f"📊 File size: {file_size} bytes")
    
    if file_size == 0:
        raise ValueError("Audio file is empty (0 bytes)")
    
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            with open(audio_file_path, "rb") as f:
                files = {"audio": (os.path.basename(audio_file_path), f, "audio/ogg")}
                
                logger.info("🚀 Sending request to STT endpoint...")
                response = await client.post(endpoint, files=files)
                response.raise_for_status()
        
        logger.info("✅ Transcription response received")
        
        # Clean up temp file on success
        logger.info("🗑️ Cleaning up temp file...")
        os.remove(audio_file_path)
        
        return response.json()
        
    except Exception as e:
        logger.error(f"❌ Error transcribing audio: {e}")
        logger.warning(f"⚠️ Keeping audio file for inspection: {audio_file_path}")
        raise
