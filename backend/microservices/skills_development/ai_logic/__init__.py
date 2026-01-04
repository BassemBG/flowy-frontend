"""
AI Logic Package for Skills Development Microservice

This package contains:
- Newsletter Generation Pipeline with LLM-as-a-Judge evaluation
- Enhanced Recommendation System with personalized scoring
- Storage services for ChromaDB and Neo4j
- Translation evaluation (future integration)
"""

from .graph_builder_with_eval import run_daily_articles_with_evaluation
from .enhanced_recommendation_service import enhanced_recommendation_service
from .storage_service import storage_service
from .neo4j_manager import neo4j_manager
from .chroma_manager import chroma_manager
from .article_evaluator import article_evaluator

__all__ = [
    "run_daily_articles_with_evaluation",
    "enhanced_recommendation_service",
    "storage_service",
    "neo4j_manager",
    "chroma_manager",
    "article_evaluator",
]
