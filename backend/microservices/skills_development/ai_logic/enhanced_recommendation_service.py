# src/recommender/enhanced_recommendation_service.py
"""
Enhanced Recommendation System with:
- Personalized relevance scoring
- Rating-based recommendations
- Incremental similarity updates
- Diversity algorithm
- Recency weighting
- Recommendation explanations
- Cold start strategy
"""

from typing import List, Dict, Tuple, Optional
from datetime import datetime, timezone
import numpy as np
from .neo4j_manager import neo4j_manager
from .chroma_manager import chroma_manager
from .logger import log


class EnhancedRecommendationService:
    """
    Advanced recommendation engine with personalized ranking and explanations.
    """

    def __init__(
        self,
        similarity_threshold: float = 0.70,
        diversity_threshold: float = 0.85,
        recency_weight: float = 0.15,
        rating_weight: float = 0.30,
        similarity_weight: float = 0.35,
        topic_weight: float = 0.20,
    ):
        """
        Initialize enhanced recommendation service.

        Args:
            similarity_threshold: Minimum cosine similarity to create SIMILAR_TO edge
            diversity_threshold: Max similarity between recommended items (avoid redundancy)
            recency_weight: Weight for article recency in scoring (0-1)
            rating_weight: Weight for user ratings in scoring (0-1)
            similarity_weight: Weight for content similarity in scoring (0-1)
            topic_weight: Weight for topic matching in scoring (0-1)
        """
        self.similarity_threshold = similarity_threshold
        self.diversity_threshold = diversity_threshold
        self.recency_weight = recency_weight
        self.rating_weight = rating_weight
        self.similarity_weight = similarity_weight
        self.topic_weight = topic_weight

        self.neo4j = neo4j_manager
        self.collection = chroma_manager.get_collection()

        # Normalize weights to sum to 1
        total_weight = rating_weight + similarity_weight + topic_weight + recency_weight
        self.rating_weight /= total_weight
        self.similarity_weight /= total_weight
        self.topic_weight /= total_weight
        self.recency_weight /= total_weight

        log(f"[EnhancedRecs] Initialized with weights: rating={self.rating_weight:.2f}, "
            f"similarity={self.similarity_weight:.2f}, topic={self.topic_weight:.2f}, "
            f"recency={self.recency_weight:.2f}")

    # ========================================================================
    # INCREMENTAL SIMILARITY UPDATES
    # ========================================================================

    def update_similarities_for_new_articles(self, new_article_ids: List[str]) -> int:
        """
        Incrementally compute similarities only for new articles.
        Much faster than full O(n²) recomputation.

        Args:
            new_article_ids: List of newly added article IDs

        Returns:
            Number of new SIMILAR_TO relationships created
        """
        if not new_article_ids:
            return 0

        log(f"[EnhancedRecs] Computing similarities for {len(new_article_ids)} new articles...")

        # Get all articles from ChromaDB
        data = self.collection.get(include=["embeddings", "metadatas"])
        all_ids = data["ids"]
        all_embeddings = np.array(data["embeddings"], dtype=np.float32)
        all_metadatas = data["metadatas"]

        # Normalize embeddings
        norms = np.linalg.norm(all_embeddings, axis=1, keepdims=True)
        all_embeddings = all_embeddings / np.clip(norms, 1e-10, None)

        # Build ID to index mapping
        id_to_idx = {aid: idx for idx, aid in enumerate(all_ids)}

        count = 0

        # For each new article, compare against ALL articles (including other new ones)
        for new_id in new_article_ids:
            if new_id not in id_to_idx:
                log(f"[EnhancedRecs] Warning: {new_id} not found in ChromaDB, skipping")
                continue

            new_idx = id_to_idx[new_id]
            new_embedding = all_embeddings[new_idx]

            # Compute similarity with all other articles
            similarities = np.dot(all_embeddings, new_embedding)

            for other_idx, sim in enumerate(similarities):
                other_id = all_ids[other_idx]

                # Skip self-comparison
                if other_id == new_id:
                    continue

                # Only create edge if similarity exceeds threshold
                if sim >= self.similarity_threshold:
                    # Create bidirectional edge
                    self._create_similarity_edge(new_id, other_id, float(sim))
                    count += 1

        log(f"[EnhancedRecs] ✓ Created {count} new similarity relationships")
        return count

    def _create_similarity_edge(self, article1: str, article2: str, score: float):
        """Create SIMILAR_TO relationship between two articles."""
        query = """
        MATCH (a1:Article {article_id: $a1})
        MATCH (a2:Article {article_id: $a2})
        MERGE (a1)-[s:SIMILAR_TO]->(a2)
        SET s.score = $score
        """
        self.neo4j.run_query(query, a1=article1, a2=article2, score=score)

    # ========================================================================
    # COLD START STRATEGY
    # ========================================================================

    def get_cold_start_recommendations(self, limit: int = 10) -> List[Dict]:
        """
        Recommend popular articles to new users with no reading history.

        Strategy:
        1. Articles with most reads
        2. Articles with highest average ratings
        3. Most recent articles

        Returns:
            List of article dictionaries with scores and explanations
        """
        log("[EnhancedRecs] Generating cold-start recommendations...")

        query = """
        // Get articles with read counts and average ratings
        MATCH (a:Article)
        OPTIONAL MATCH (u:User)-[:READ]->(a)
        WITH a, COUNT(DISTINCT u) AS read_count

        OPTIONAL MATCH (u2:User)-[r:RATED]->(a)
        WITH a, read_count, AVG(r.score) AS avg_rating, COUNT(r) AS rating_count

        // Cold start score: combine popularity + ratings + recency
        WITH a,
             read_count,
             COALESCE(avg_rating, 3.0) AS avg_rating,
             rating_count,
             // Parse created_at to get recency (newer = higher score)
             CASE
                WHEN a.created_at IS NOT NULL
                THEN 1.0 / (1.0 + (duration.between(datetime(a.created_at), datetime()).days / 30.0))
                ELSE 0.5
             END AS recency_score

        // Combined cold start score
        WITH a,
             read_count,
             avg_rating,
             rating_count,
             recency_score,
             (read_count * 0.4 + avg_rating * 0.4 + recency_score * 10 * 0.2) AS cold_start_score

        ORDER BY cold_start_score DESC
        LIMIT $limit

        RETURN a.article_id AS article_id,
               a.title AS title,
               a.topic AS topic,
               a.created_at AS created_at,
               read_count,
               avg_rating,
               rating_count,
               recency_score,
               cold_start_score
        """

        results = self.neo4j.run_query(query, limit=limit)

        recommendations = []
        for row in results:
            recommendations.append({
                "article_id": row["article_id"],
                "title": row.get("title", "Untitled"),
                "topic": row.get("topic", "General"),
                "score": row["cold_start_score"],
                "explanation": self._generate_cold_start_explanation(
                    row["read_count"],
                    row["avg_rating"],
                    row["rating_count"]
                ),
                "metadata": {
                    "read_count": row["read_count"],
                    "avg_rating": row["avg_rating"],
                    "rating_count": row["rating_count"],
                    "recency_score": row["recency_score"],
                }
            })

        return recommendations

    def _generate_cold_start_explanation(
        self,
        read_count: int,
        avg_rating: float,
        rating_count: int
    ) -> str:
        """Generate explanation for cold-start recommendation."""
        reasons = []

        if read_count > 10:
            reasons.append(f"popular ({read_count} reads)")
        elif read_count > 5:
            reasons.append(f"trending ({read_count} reads)")

        if rating_count > 0 and avg_rating >= 4.0:
            reasons.append(f"highly rated ({avg_rating:.1f}/5)")

        if not reasons:
            reasons.append("recommended for new users")

        return "Recommended because it's " + " and ".join(reasons)

    # ========================================================================
    # PERSONALIZED RECOMMENDATIONS WITH RANKING
    # ========================================================================

    def get_user_recommendations(
        self,
        user_id: str,
        limit: int = 10,
        include_explanations: bool = True,
        apply_diversity: bool = True
    ) -> List[Dict]:
        """
        Get personalized recommendations with ranking and explanations.

        Args:
            user_id: User ID
            limit: Maximum number of recommendations
            include_explanations: Whether to include recommendation explanations
            apply_diversity: Whether to apply diversity filtering

        Returns:
            List of recommendation dictionaries with scores and explanations
        """
        # Ensure user exists
        self.neo4j.add_user(user_id)

        # Check if user has reading history
        has_history = self._user_has_reading_history(user_id)

        if not has_history:
            log(f"[EnhancedRecs] User {user_id} has no history - using cold start")
            return self.get_cold_start_recommendations(limit)

        # Get candidate recommendations from multiple sources
        candidates = self._get_recommendation_candidates(user_id)

        if not candidates:
            log(f"[EnhancedRecs] No candidates found, falling back to cold start")
            return self.get_cold_start_recommendations(limit)

        # Score and rank candidates
        scored_candidates = self._score_candidates(user_id, candidates)

        # Apply diversity filtering
        if apply_diversity:
            scored_candidates = self._apply_diversity_filter(scored_candidates, limit * 2)

        # Sort by score and take top N
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        top_recommendations = scored_candidates[:limit]

        # Enrich with metadata and explanations
        if include_explanations:
            top_recommendations = self._enrich_with_explanations(user_id, top_recommendations)

        return top_recommendations

    def _user_has_reading_history(self, user_id: str) -> bool:
        """Check if user has any reading history."""
        query = """
        MATCH (u:User {user_id: $user_id})-[:READ]->(:Article)
        RETURN COUNT(*) AS read_count
        """
        result = self.neo4j.run_query(query, user_id=user_id)
        return result[0]["read_count"] > 0 if result else False

    def _get_recommendation_candidates(self, user_id: str) -> List[Dict]:
        """
        Get candidate articles from multiple sources:
        - Similar to articles user has read
        - Same topics as user has read
        - Highly rated by other users
        """
        query = """
        // Get user's reading history
        MATCH (u:User {user_id: $user_id})-[:READ]->(read_article:Article)
        WITH u, COLLECT(DISTINCT read_article.article_id) AS read_ids,
             COLLECT(DISTINCT read_article.topic) AS read_topics

        // Source 1: Similar articles
        UNWIND read_ids AS rid
        OPTIONAL MATCH (:Article {article_id: rid})-[sim:SIMILAR_TO]->(similar:Article)
        WHERE NOT similar.article_id IN read_ids
        WITH u, read_ids, read_topics,
             COLLECT(DISTINCT {
                 article_id: similar.article_id,
                 title: similar.title,
                 topic: similar.topic,
                 created_at: similar.created_at,
                 source: 'similarity',
                 similarity_score: sim.score,
                 source_article: rid
             }) AS similar_candidates

        // Source 2: Topic-based articles
        UNWIND read_topics AS topic
        OPTIONAL MATCH (topic_article:Article {topic: topic})
        WHERE NOT topic_article.article_id IN read_ids
        WITH u, read_ids, similar_candidates,
             COLLECT(DISTINCT {
                 article_id: topic_article.article_id,
                 title: topic_article.title,
                 topic: topic_article.topic,
                 created_at: topic_article.created_at,
                 source: 'topic',
                 matched_topic: topic
             }) AS topic_candidates

        // Source 3: Highly rated articles
        MATCH (other_article:Article)
        WHERE NOT other_article.article_id IN read_ids
        OPTIONAL MATCH (other_user:User)-[rating:RATED]->(other_article)
        WITH u, similar_candidates, topic_candidates,
             other_article,
             AVG(rating.score) AS avg_rating,
             COUNT(rating) AS rating_count
        WHERE rating_count > 0
        WITH u, similar_candidates, topic_candidates,
             COLLECT({
                 article_id: other_article.article_id,
                 title: other_article.title,
                 topic: other_article.topic,
                 created_at: other_article.created_at,
                 source: 'ratings',
                 avg_rating: avg_rating,
                 rating_count: rating_count
             }) AS rating_candidates

        // Combine all sources
        WITH similar_candidates + topic_candidates + rating_candidates AS all_candidates
        UNWIND all_candidates AS candidate
        RETURN DISTINCT candidate
        """

        results = self.neo4j.run_query(query, user_id=user_id)

        # Group candidates by article_id and merge sources
        candidates_map = {}
        for row in results:
            candidate = row["candidate"]
            if not candidate:
                continue

            article_id = candidate["article_id"]
            if article_id not in candidates_map:
                candidates_map[article_id] = candidate
                candidates_map[article_id]["sources"] = []

            candidates_map[article_id]["sources"].append(candidate.get("source", "unknown"))

        return list(candidates_map.values())

    def _score_candidates(self, user_id: str, candidates: List[Dict]) -> List[Dict]:
        """
        Score each candidate using weighted combination of:
        - Similarity score
        - Topic affinity
        - Rating score
        - Recency score
        """
        scored = []

        for candidate in candidates:
            # Calculate individual component scores
            similarity_score = self._calculate_similarity_score(candidate)
            topic_score = self._calculate_topic_score(user_id, candidate)
            rating_score = self._calculate_rating_score(candidate)
            recency_score = self._calculate_recency_score(candidate)

            # Weighted combination
            final_score = (
                self.similarity_weight * similarity_score +
                self.topic_weight * topic_score +
                self.rating_weight * rating_score +
                self.recency_weight * recency_score
            )

            scored.append({
                "article_id": candidate["article_id"],
                "title": candidate.get("title", "Untitled"),
                "topic": candidate.get("topic", "General"),
                "score": final_score,
                "component_scores": {
                    "similarity": similarity_score,
                    "topic": topic_score,
                    "rating": rating_score,
                    "recency": recency_score,
                },
                "sources": candidate.get("sources", []),
                "metadata": candidate
            })

        return scored

    def _calculate_similarity_score(self, candidate: Dict) -> float:
        """Calculate similarity component score (0-1)."""
        if "similarity" in candidate.get("sources", []):
            sim_score = candidate.get("similarity_score")
            if sim_score is not None and isinstance(sim_score, (int, float)):
                return float(sim_score)
            return 0.5
        return 0.0

    def _calculate_topic_score(self, user_id: str, candidate: Dict) -> float:
        """Calculate topic affinity score (0-1)."""
        if "topic" not in candidate.get("sources", []):
            return 0.0

        # Get user's topic affinity from Neo4j
        topic = candidate.get("topic") or candidate.get("matched_topic")
        if not topic:
            return 0.5

        query = """
        MATCH (u:User {user_id: $user_id})-[i:INTERESTED_IN]->(t:Topic {name: $topic})
        RETURN i.score AS affinity
        """
        result = self.neo4j.run_query(query, user_id=user_id, topic=topic)

        if result and result[0].get("affinity") is not None:
            affinity = result[0]["affinity"]
            if isinstance(affinity, (int, float)):
                # Normalize affinity score (assuming max ~20 reads)
                return min(1.0, float(affinity) / 20.0)

        return 0.5  # Default for matching topic

    def _calculate_rating_score(self, candidate: Dict) -> float:
        """Calculate rating component score (0-1)."""
        if "ratings" not in candidate.get("sources", []):
            return 0.5  # Neutral if no rating data

        avg_rating = candidate.get("avg_rating")
        rating_count = candidate.get("rating_count", 0)

        # Handle None or invalid ratings
        if avg_rating is None or not isinstance(avg_rating, (int, float)):
            return 0.5  # Neutral if no valid rating

        # Normalize rating to 0-1 (assuming 5-star scale)
        normalized_rating = float(avg_rating) / 5.0

        # Apply confidence factor based on rating count
        confidence = min(1.0, float(rating_count) / 10.0)

        return normalized_rating * confidence + 0.5 * (1 - confidence)

    def _calculate_recency_score(self, candidate: Dict) -> float:
        """Calculate recency score (0-1, newer = higher)."""
        created_at = candidate.get("created_at")
        if not created_at:
            return 0.5  # Unknown age = neutral

        try:
            created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            age_days = (now - created_date).days

            # Exponential decay: score = e^(-age_days / 30)
            # Articles lose half their recency bonus after ~21 days
            recency_score = np.exp(-age_days / 30.0)
            return float(recency_score)
        except:
            return 0.5

    # ========================================================================
    # DIVERSITY FILTERING
    # ========================================================================

    def _apply_diversity_filter(
        self,
        candidates: List[Dict],
        max_candidates: int
    ) -> List[Dict]:
        """
        Apply diversity filtering to avoid recommending too-similar articles.
        Uses Maximal Marginal Relevance (MMR) algorithm.
        """
        if len(candidates) <= max_candidates:
            return candidates

        log(f"[EnhancedRecs] Applying diversity filter to {len(candidates)} candidates...")

        # Get embeddings for all candidate articles
        article_ids = [c["article_id"] for c in candidates]
        embeddings_map = self._get_embeddings_for_articles(article_ids)

        # Filter out candidates without embeddings
        candidates_with_emb = [
            c for c in candidates
            if c["article_id"] in embeddings_map
        ]

        if not candidates_with_emb:
            return candidates[:max_candidates]

        # MMR algorithm
        selected = []
        remaining = candidates_with_emb.copy()

        # Select first (highest score) candidate
        selected.append(remaining.pop(0))

        # Iteratively select diverse candidates
        while len(selected) < max_candidates and remaining:
            best_idx = 0
            best_mmr_score = -float('inf')

            for idx, candidate in enumerate(remaining):
                # Relevance score (original ranking score)
                relevance = candidate["score"]

                # Diversity score (min similarity to selected items)
                candidate_emb = embeddings_map[candidate["article_id"]]

                max_similarity = 0.0
                for selected_candidate in selected:
                    selected_emb = embeddings_map[selected_candidate["article_id"]]
                    similarity = float(np.dot(candidate_emb, selected_emb))
                    max_similarity = max(max_similarity, similarity)

                # MMR score: balance relevance and diversity
                mmr_score = 0.7 * relevance - 0.3 * max_similarity

                if mmr_score > best_mmr_score:
                    best_mmr_score = mmr_score
                    best_idx = idx

            selected.append(remaining.pop(best_idx))

        log(f"[EnhancedRecs] ✓ Diversified to {len(selected)} candidates")
        return selected

    def _get_embeddings_for_articles(self, article_ids: List[str]) -> Dict[str, np.ndarray]:
        """Get normalized embeddings for a list of article IDs."""
        data = self.collection.get(ids=article_ids, include=["embeddings"])

        embeddings_map = {}
        for i, article_id in enumerate(data["ids"]):
            embedding = np.array(data["embeddings"][i], dtype=np.float32)
            # Normalize
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            embeddings_map[article_id] = embedding

        return embeddings_map

    # ========================================================================
    # RECOMMENDATION EXPLANATIONS
    # ========================================================================

    def _enrich_with_explanations(
        self,
        user_id: str,
        recommendations: List[Dict]
    ) -> List[Dict]:
        """Add human-readable explanations to recommendations."""
        enriched = []

        for rec in recommendations:
            explanation = self._generate_explanation(user_id, rec)
            rec["explanation"] = explanation
            enriched.append(rec)

        return enriched

    def _generate_explanation(self, user_id: str, recommendation: Dict) -> str:
        """Generate explanation for why article was recommended."""
        sources = recommendation.get("sources", [])
        scores = recommendation.get("component_scores", {})
        metadata = recommendation.get("metadata", {})

        reasons = []

        # Similarity-based
        if "similarity" in sources and scores.get("similarity", 0) > 0.7:
            source_article = metadata.get("source_article")
            if source_article:
                reasons.append(f"similar to articles you've read")
            else:
                reasons.append("matches your reading style")

        # Topic-based
        if "topic" in sources and scores.get("topic", 0) > 0.6:
            topic = recommendation.get("topic", "this topic")
            reasons.append(f"you enjoy {topic}")

        # Rating-based
        if "ratings" in sources and scores.get("rating", 0) > 0.7:
            avg_rating = metadata.get("avg_rating", 0)
            if avg_rating >= 4.0:
                reasons.append(f"highly rated by other users ({avg_rating:.1f}/5)")

        # Recency
        if scores.get("recency", 0) > 0.8:
            reasons.append("recently published")

        # Default
        if not reasons:
            reasons.append("recommended for you")

        return "Recommended because " + " and ".join(reasons)

    # ========================================================================
    # BACKWARDS COMPATIBILITY
    # ========================================================================

    def get_user_recommendations_simple(self, user_id: str, limit: int = 10) -> List[str]:
        """
        Backwards-compatible method that returns just article IDs.
        Used by existing code (main.py, app.py).
        """
        recommendations = self.get_user_recommendations(
            user_id=user_id,
            limit=limit,
            include_explanations=False,
            apply_diversity=True
        )

        return [rec["article_id"] for rec in recommendations]


# Singleton instance
enhanced_recommendation_service = EnhancedRecommendationService()