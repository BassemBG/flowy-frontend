"""AI Glossary Microservice - FastAPI Application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="AI Glossary Service",
    description="Glossary management with semantic search powered by ChromaDB",
    version="1.0.0"
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(router)


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "ok", "service": "ai_glossary"}
