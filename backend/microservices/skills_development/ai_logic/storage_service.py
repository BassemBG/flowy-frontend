# src/storage/storage_service.py
"""
Unified Storage Service

- Generates unified article IDs
- Saves to ChromaDB (semantic memory) and Neo4j (graph)
- Handles duplicate topic checks and storage stats
"""

from typing import List, Dict, Optional
from datetime import datetime, timezone
import uuid

from .chroma_manager import chroma_manager
from .neo4j_manager import Neo4jManager
from .logger import log

# Import enhanced recommendation service for incremental similarity updates
try:
    from .enhanced_recommendation_service import enhanced_recommendation_service
    ENHANCED_RECS_AVAILABLE = True
except ImportError:
    ENHANCED_RECS_AVAILABLE = False
    log("[StorageService] Enhanced recommendations not available, similarity updates will be manual", level="WARNING")


class StorageService:
    def __init__(self):
        self.neo4j = Neo4jManager()

    # ---------- Duplicate checks ----------

    def is_topic_duplicate(self, topic: str, threshold: float = 0.85) -> bool:
        """
        Check if a semantically similar topic already exists in ChromaDB.
        """
        try:
            similar_articles = chroma_manager.search_similar(
                query=topic,
                n_results=1
            )
            if not similar_articles:
                return False

            sim = similar_articles[0]["similarity"]
            log(f"[StorageService] Topic similarity: {sim:.3f} (threshold={threshold})")

            return sim >= threshold
        except Exception as e:
            log(f"[StorageService] Error in is_topic_duplicate: {e}", level="ERROR")
            return False

    # ---------- Save operations ----------

    def save_article(
        self,
        topic: str,
        article_text: str,
        vocab_summary: str,
        author: str = "LLM",
        source_urls: Optional[List[str]] = None,
    ) -> str:
        """
        Save an article to both ChromaDB and Neo4j using a unified article_id.

        Returns:
            article_id (str)
        """
        article_id = uuid.uuid4().hex
        created_at = datetime.now(timezone.utc).isoformat()

        # 1) Save to ChromaDB (article_id is used as doc ID)
        try:
            doc_id = chroma_manager.add_article(
                title=topic,
                content=article_text,
                topic=topic,
                vocab_summary=vocab_summary,
                author=author,
                article_id=article_id,  # unify ID
            )
            log(f"[StorageService] Article saved in ChromaDB (doc_id={doc_id})")
        except Exception as e:
            log(f"[StorageService] Failed to save article to ChromaDB: {e}", level="ERROR")
            raise

        # 2) Save to Neo4j
        try:
            self.neo4j.add_article(
                article_id=article_id,
                title=topic,
                topic=topic,
                created_at=created_at,
            )
            # If you want, also store vocab_summary or source_urls as properties
            log(f"[StorageService] Article saved in Neo4j (id={article_id})")
        except Exception as e:
            log(f"[StorageService] Failed to save article to Neo4j: {e}", level="ERROR")
            # You might want to decide whether to delete from Chroma on failure
            raise

        # 3) Incrementally update similarity graph for new article
        if ENHANCED_RECS_AVAILABLE:
            try:
                log(f"[StorageService] Computing similarities for new article {article_id}...")
                count = enhanced_recommendation_service.update_similarities_for_new_articles([article_id])
                log(f"[StorageService] ✓ Created {count} similarity relationships")
            except Exception as e:
                log(f"[StorageService] Warning: Failed to update similarities: {e}", level="WARNING")
                # Non-critical, continue

        return article_id

    # ---------- Read/utility operations ----------

    def get_storage_stats(self) -> Dict:
        """Return high-level stats for UI."""
        try:
            total = chroma_manager.get_article_count()
            topics = chroma_manager.get_all_topics()
            return {
                "total_articles": total,
                "unique_topics": len(topics),
                "topics": topics,
            }
        except Exception as e:
            log(f"[StorageService] Error getting stats: {e}", level="ERROR")
            return {"total_articles": 0, "unique_topics": 0, "topics": []}

    def get_all_articles(self) -> List[Dict]:
        """Fetch all articles from ChromaDB."""
        collection = chroma_manager.get_collection()
        if collection.count() == 0:
            return []

        results = collection.get()
        articles = []
        for doc_id, doc, meta in zip(results["ids"], results["documents"], results["metadatas"]):
            articles.append(
                {
                    "id": doc_id,
                    "article_id": meta.get("article_id", doc_id),
                    "topic": meta.get("topic"),
                    "title": meta.get("title"),
                    "vocab_summary": meta.get("vocab_summary", ""),
                    "content": doc,
                    "created_at": meta.get("created_at"),
                }
            )
        return articles

    def delete_article_by_id(self, article_id: str) -> bool:
        """Delete article from ChromaDB by ID. (You can extend to also remove from Neo4j.)"""
        try:
            return chroma_manager.delete_article(article_id)
        except Exception as e:
            log(f"[StorageService] Error deleting article {article_id}: {e}", level="ERROR")
            return False


# Singleton instance
storage_service = StorageService()
