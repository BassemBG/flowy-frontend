"""
WhatsApp Agent Microservice
Main FastAPI application entry point.
"""

import os
import logging

from fastapi import FastAPI
from dotenv import load_dotenv

from router import router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

MODEL_ENDPOINT = os.getenv("MODEL_ENDPOINT", "http://localhost:8010/chat")

app = FastAPI(
    title="WhatsApp Agent Microservice",
    description="WhatsApp Business API webhook handler with AI-powered responses",
    version="1.0.0"
)

app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Log startup info."""
    logger.info("🚀 Starting WhatsApp Agent Microservice...")
    logger.info(f"📍 Model Endpoint: {MODEL_ENDPOINT}")
    logger.info("✅ Ready to receive WhatsApp messages!")


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "ok",
        "service": "whatsapp_agent",
        "model_endpoint": MODEL_ENDPOINT
    }
