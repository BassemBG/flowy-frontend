# src/nodes/storage_node.py
"""
Storage Node

Thin wrapper around StorageService + ChromaDB manager for:
- duplicate checks
- saving articles (used by LangGraph)
- searching
- stats for the UI
"""

from typing import List, Dict, Optional
from .logger import log
from .storage_service import storage_service
from .chroma_manager import chroma_manager


# ==================== DUPLICATE CHECKING ====================

def is_topic_in_db(topic: str, threshold: float = 0.85) -> bool:
    """
    Check if a similar topic already exists in the database.
    Uses StorageService (Chroma semantic search).
    """
    return storage_service.is_topic_duplicate(topic, threshold=threshold)


def is_duplicate_article(content: str, threshold: float = 0.85) -> bool:
    """
    Check if similar article content already exists.
    Uses ChromaDB's intrinsic duplicate check.
    """
    try:
        return chroma_manager.is_duplicate(content, threshold)
    except Exception as e:
        log(f"[StorageNode] Error checking duplicate: {e}", level="ERROR")
        return False


# ==================== SAVE OPERATIONS ====================

def save_article_to_db(
    topic: str,
    article: str,
    vocab_summary: str,
    author: str = "LLM"
) -> Optional[str]:
    """
    Save an LLM-generated article and metadata to both ChromaDB and Neo4j
    via StorageService.

    Returns:
        article_id (str) if successful, None otherwise.
    """
    try:
        article_id = storage_service.save_article(
            topic=topic,
            article_text=article,
            vocab_summary=vocab_summary,
            author=author,
        )
        log(f"[StorageNode] Article '{topic}' saved (article_id: {article_id})")
        return article_id
    except Exception as e:
        log(f"[StorageNode] Failed to save article '{topic}': {e}", level="ERROR")
        return None


# ==================== FETCH / SEARCH OPERATIONS ====================

def fetch_all_topics() -> List[str]:
    """Retrieve all stored topics."""
    try:
        topics = chroma_manager.get_all_topics()
        log(f"[StorageNode] Retrieved {len(topics)} unique topics")
        return topics
    except Exception as e:
        log(f"[StorageNode] Error fetching topics: {e}", level="ERROR")
        return []


def fetch_articles_by_topic(topic_query: str, top_k: int = 3) -> List[Dict]:
    """
    Fetch similar articles for a given topic using semantic search.
    Returns list of articles with similarity scores.
    """
    try:
        articles = chroma_manager.search_similar(
            query=topic_query,
            n_results=top_k,
        )

        formatted_articles = []
        for article in articles:
            formatted_articles.append(
                {
                    "topic": article["metadata"].get("topic", "Unknown"),
                    "title": article["metadata"].get("title", "Untitled"),
                    "vocab_summary": article["metadata"].get("vocab_summary", ""),
                    "article": article["content"],
                    "similarity": article["similarity"],
                    "created_at": article["metadata"].get("created_at", ""),
                }
            )

        log(f"[StorageNode] Found {len(formatted_articles)} articles for '{topic_query}'")
        return formatted_articles

    except Exception as e:
        log(f"[StorageNode] Error fetching articles: {e}", level="ERROR")
        return []


def search_articles(query: str, n_results: int = 5, filter_topic: Optional[str] = None) -> List[Dict]:
    """
    General semantic search across all articles.
    """
    try:
        return chroma_manager.search_similar(
            query=query,
            n_results=n_results,
            filter_topic=filter_topic,
        )
    except Exception as e:
        log(f"[StorageNode] Error searching articles: {e}", level="ERROR")
        return []


# ==================== STATISTICS ====================

def get_storage_stats() -> Dict:
    """Get database statistics (used by UI)."""
    return storage_service.get_storage_stats()


def delete_article_by_id(doc_id: str) -> bool:
    """Delete an article by its ID."""
    return storage_service.delete_article_by_id(doc_id)
