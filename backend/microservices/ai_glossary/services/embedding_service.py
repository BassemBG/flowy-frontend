"""Embedding service using HuggingFace Inference API."""
import httpx
import logging
from typing import List
from config import settings

logger = logging.getLogger(__name__)

# HuggingFace Inference API endpoint (new correct format)
API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"


def _get_headers() -> dict:
    """Get authorization headers for HuggingFace API."""
    if not settings.HF_TOKEN:
        raise ValueError("HF_TOKEN environment variable is not set")
    return {"Authorization": f"Bearer {settings.HF_TOKEN}"}


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed a list of texts using HuggingFace Inference API.
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of embedding vectors (lists of floats)
        
    Raises:
        ValueError: If HF_TOKEN is not set
        httpx.HTTPError: If API request fails
    """
    if not texts:
        return []
    
    # Normalize texts
    normalized_texts = [text.strip() for text in texts if text.strip()]
    if not normalized_texts:
        return []
    
    logger.info(f"Embedding {len(normalized_texts)} texts via HuggingFace API")
    
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                API_URL,
                headers=_get_headers(),
                json={"inputs": normalized_texts, "options": {"wait_for_model": True}}
            )
            response.raise_for_status()
            embeddings = response.json()
            
            logger.info(f"Successfully embedded {len(embeddings)} texts")
            return embeddings
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HuggingFace API error: {e.response.status_code} - {e.response.text}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Request error: {e}")
        raise


def embed_single(text: str) -> List[float]:
    """
    Embed a single text string.
    
    Args:
        text: Text string to embed
        
    Returns:
        Embedding vector as list of floats
    """
    result = embed_texts([text])
    if result:
        return result[0]
    return []
