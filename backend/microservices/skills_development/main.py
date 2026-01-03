"""
FastAPI Backend for Skills Development Microservice
Newsletter Agent System - AI-Powered Article Generation & Recommendations
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from ai_logic.graph_builder_with_eval import run_daily_articles_with_evaluation
from ai_logic.enhanced_recommendation_service import enhanced_recommendation_service
from ai_logic.storage_service import storage_service
from ai_logic.neo4j_manager import neo4j_manager
from ai_logic.chroma_manager import chroma_manager
from ai_logic.article_evaluator import article_evaluator

# Initialize FastAPI app
app = FastAPI(
    title="Skills Development API",
    description="AI-Powered Newsletter Generation with Enhanced Recommendations",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Pydantic Models (Request/Response Schemas)
# ============================================================================

class ArticleGenerationRequest(BaseModel):
    """Request model for generating articles"""
    topics: List[str] = Field(..., description="List of topics to generate articles for", min_items=1, max_items=10)
    count_per_topic: int = Field(1, description="Number of articles per topic", ge=1, le=5)
    quality_threshold: float = Field(85.0, description="Minimum quality score (0-100)", ge=0, le=100)
    max_regeneration_attempts: int = Field(2, description="Max regeneration attempts", ge=0, le=5)

class ArticleResponse(BaseModel):
    """Response model for article data"""
    article_id: str
    title: str
    content: str
    topic: str
    created_at: str
    quality_score: Optional[float] = None
    evaluation_details: Optional[Dict[str, Any]] = None
    vocabulary: Optional[List[str]] = None

class RecommendationRequest(BaseModel):
    """Request model for getting recommendations"""
    user_id: str = Field(..., description="User ID for personalized recommendations")
    limit: int = Field(10, description="Number of recommendations", ge=1, le=50)
    strategy: str = Field("personalized", description="Strategy: 'personalized' or 'cold_start'")
    apply_diversity: bool = Field(True, description="Apply diversity filtering")
    include_explanations: bool = Field(True, description="Include recommendation explanations")

class RecommendationResponse(BaseModel):
    """Response model for recommendations"""
    article_id: str
    title: str
    topic: str
    score: float
    explanation: Optional[str] = None
    component_scores: Optional[Dict[str, float]] = None
    metadata: Optional[Dict[str, Any]] = None

class UserInteractionRequest(BaseModel):
    """Request model for user interactions"""
    user_id: str
    article_id: str
    interaction_type: str = Field(..., description="Type: 'read', 'rate', 'bookmark'")
    rating: Optional[int] = Field(None, description="Rating 1-5 stars", ge=1, le=5)

class SystemStatsResponse(BaseModel):
    """Response model for system statistics"""
    total_articles: int
    total_users: int
    total_interactions: int
    avg_quality_score: float
    topics_count: int
    database_status: Dict[str, str]

# ============================================================================
# Newsletter Generation Endpoints
# ============================================================================

@app.post("/api/newsletter/generate", response_model=List[ArticleResponse], tags=["Newsletter"])
async def generate_articles(request: ArticleGenerationRequest, background_tasks: BackgroundTasks):
    """
    Generate newsletter articles with LLM-as-a-Judge evaluation

    - **topics**: List of topics to generate articles for
    - **count_per_topic**: Number of articles per topic
    - **quality_threshold**: Minimum acceptable quality score (0-100)
    - **max_regeneration_attempts**: Max attempts to regenerate low-quality articles
    """
    try:
        # Prepare topics list
        all_topics = []
        for topic in request.topics:
            all_topics.extend([topic] * request.count_per_topic)

        # Run article generation with evaluation
        results = run_daily_articles_with_evaluation(
            topics=all_topics,
            quality_threshold=request.quality_threshold,
            max_regeneration_attempts=request.max_regeneration_attempts
        )

        # Format response
        articles = []
        for result in results:
            evaluation = result.get("evaluation", {})

            # Parse vocabulary from summary
            vocab_summary = result.get("vocab_summary", "")
            vocabulary = []
            if vocab_summary:
                # Extract terms from bullet points (format: "- Term: Definition")
                for line in vocab_summary.split("\n"):
                    line = line.strip()
                    if line.startswith("-"):
                        # Extract just the term (before the colon)
                        term_part = line.lstrip("- ").split(":")[0].strip()
                        if term_part:
                            vocabulary.append(term_part)

            articles.append(ArticleResponse(
                article_id=result.get("article_id", str(uuid.uuid4())),
                title=result.get("topic", "Untitled"),  # Use topic as title
                content=result.get("article", ""),
                topic=result.get("topic", "General"),
                created_at=datetime.utcnow().isoformat(),
                quality_score=evaluation.get("overall_score") if evaluation else None,
                evaluation_details={
                    "task_performance": evaluation.get("task_performance"),
                    "alignment": evaluation.get("alignment"),
                    "feedback": evaluation.get("feedback")
                } if evaluation else None,
                vocabulary=vocabulary
            ))

        return articles

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Article generation failed: {str(e)}")

@app.get("/api/newsletter/articles", response_model=List[ArticleResponse], tags=["Newsletter"])
async def get_articles(
    topic: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """
    Retrieve stored articles with optional filtering

    - **topic**: Filter by topic (optional)
    - **limit**: Number of articles to return
    - **offset**: Pagination offset
    """
    try:
        # Query ChromaDB
        collection = chroma_manager.get_collection()

        if topic:
            # Filter by topic
            results = collection.get(
                where={"topic": topic},
                limit=limit,
                offset=offset,
                include=["metadatas", "documents"]
            )
        else:
            # Get all articles
            results = collection.get(
                limit=limit,
                offset=offset,
                include=["metadatas", "documents"]
            )

        # Format response
        articles = []
        for i, article_id in enumerate(results["ids"]):
            metadata = results["metadatas"][i]
            content = results["documents"][i] if i < len(results.get("documents", [])) else ""

            articles.append(ArticleResponse(
                article_id=article_id,
                title=metadata.get("title", "Untitled"),
                content=content,
                topic=metadata.get("topic", "General"),
                created_at=metadata.get("created_at", ""),
                quality_score=metadata.get("quality_score"),
                vocabulary=metadata.get("vocabulary", "").split(",") if metadata.get("vocabulary") else []
            ))

        return articles

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve articles: {str(e)}")

@app.get("/api/newsletter/articles/{article_id}", response_model=ArticleResponse, tags=["Newsletter"])
async def get_article(article_id: str):
    """
    Retrieve a single article by ID

    - **article_id**: Unique article identifier
    """
    try:
        # Query ChromaDB
        collection = chroma_manager.get_collection()
        result = collection.get(ids=[article_id], include=["metadatas", "documents"])

        if not result["ids"]:
            raise HTTPException(status_code=404, detail="Article not found")

        metadata = result["metadatas"][0]
        content = result["documents"][0] if result.get("documents") else ""

        return ArticleResponse(
            article_id=article_id,
            title=metadata.get("title", "Untitled"),
            content=content,
            topic=metadata.get("topic", "General"),
            created_at=metadata.get("created_at", ""),
            quality_score=metadata.get("quality_score"),
            vocabulary=metadata.get("vocabulary", "").split(",") if metadata.get("vocabulary") else []
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve article: {str(e)}")

# ============================================================================
# Smart Recommendations Endpoints
# ============================================================================

@app.post("/api/recommendations/get", response_model=List[RecommendationResponse], tags=["Recommendations"])
async def get_recommendations(request: RecommendationRequest):
    """
    Get personalized article recommendations using 7-feature enhanced system

    - **user_id**: User identifier for personalization
    - **limit**: Number of recommendations
    - **strategy**: 'personalized' (default) or 'cold_start'
    - **apply_diversity**: Apply MMR diversity filtering
    - **include_explanations**: Include human-readable explanations
    """
    try:
        # Ensure user exists in Neo4j
        neo4j_manager.add_user(request.user_id)

        # Get recommendations based on strategy
        if request.strategy == "cold_start":
            recommendations = enhanced_recommendation_service.get_cold_start_recommendations(
                limit=request.limit
            )
        else:
            recommendations = enhanced_recommendation_service.get_user_recommendations(
                user_id=request.user_id,
                limit=request.limit,
                include_explanations=request.include_explanations,
                apply_diversity=request.apply_diversity
            )

        # Format response - filter out recommendations with missing data and verify articles exist
        response = []
        collection = chroma_manager.get_collection()

        for rec in recommendations:
            # Skip recommendations with missing article_id, title, or topic
            if not rec.get("article_id") or not rec.get("title") or not rec.get("topic"):
                continue

            # Verify article exists in ChromaDB
            article_id = rec["article_id"]
            try:
                check_result = collection.get(ids=[article_id], include=[])
                if not check_result["ids"]:
                    # Article doesn't exist in ChromaDB, skip it
                    continue
            except Exception:
                # Error checking article, skip it
                continue

            response.append(RecommendationResponse(
                article_id=rec["article_id"],
                title=rec.get("title", "Untitled"),
                topic=rec.get("topic", "General"),
                score=rec["score"],
                explanation=rec.get("explanation"),
                component_scores=rec.get("component_scores"),
                metadata=rec.get("metadata")
            ))

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

@app.post("/api/recommendations/interact", tags=["Recommendations"])
async def record_interaction(request: UserInteractionRequest):
    """
    Record user interaction with an article (read, rate, bookmark)

    - **user_id**: User identifier
    - **article_id**: Article identifier
    - **interaction_type**: 'read', 'rate', or 'bookmark'
    - **rating**: Rating score (1-5 stars, required for 'rate' interaction)
    """
    try:
        # Ensure user and article exist
        neo4j_manager.add_user(request.user_id)

        # Record interaction based on type
        if request.interaction_type == "read":
            neo4j_manager.add_user_read(request.user_id, request.article_id)
            return {"status": "success", "message": "Read interaction recorded"}

        elif request.interaction_type == "rate":
            if request.rating is None:
                raise HTTPException(status_code=400, detail="Rating score required for 'rate' interaction")

            neo4j_manager.add_rating(request.user_id, request.article_id, request.rating)
            return {"status": "success", "message": f"Rating {request.rating}/5 recorded"}

        elif request.interaction_type == "bookmark":
            # Add bookmark relationship (custom)
            query = """
            MATCH (u:User {user_id: $user_id})
            MATCH (a:Article {article_id: $article_id})
            MERGE (u)-[b:BOOKMARKED]->(a)
            SET b.timestamp = datetime()
            """
            neo4j_manager.run_query(query, user_id=request.user_id, article_id=request.article_id)
            return {"status": "success", "message": "Bookmark added"}

        else:
            raise HTTPException(status_code=400, detail="Invalid interaction_type. Use 'read', 'rate', or 'bookmark'")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record interaction: {str(e)}")

@app.get("/api/recommendations/user/{user_id}/history", tags=["Recommendations"])
async def get_user_history(user_id: str, limit: int = 20):
    """
    Get user's reading history

    - **user_id**: User identifier
    - **limit**: Number of articles to return
    """
    try:
        query = """
        MATCH (u:User {user_id: $user_id})-[r:READ]->(a:Article)
        OPTIONAL MATCH (u)-[rating:RATED]->(a)
        RETURN a.article_id AS article_id,
               a.title AS title,
               a.topic AS topic,
               a.created_at AS created_at,
               r.timestamp AS read_at,
               rating.score AS user_rating
        ORDER BY r.timestamp DESC
        LIMIT $limit
        """

        results = neo4j_manager.run_query(query, user_id=user_id, limit=limit)

        history = []
        for row in results:
            history.append({
                "article_id": row["article_id"],
                "title": row["title"],
                "topic": row["topic"],
                "created_at": row["created_at"],
                "read_at": row["read_at"],
                "user_rating": row["user_rating"]
            })

        return {"user_id": user_id, "history": history, "count": len(history)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user history: {str(e)}")

# ============================================================================
# System Management Endpoints
# ============================================================================

@app.get("/api/system/stats", response_model=SystemStatsResponse, tags=["System"])
async def get_system_stats():
    """
    Get overall system statistics
    """
    try:
        # Get article count from ChromaDB
        collection = chroma_manager.get_collection()
        total_articles = collection.count()

        # Get user and interaction stats from Neo4j
        stats_query = """
        MATCH (u:User)
        WITH COUNT(u) AS user_count
        MATCH (a:Article)
        WITH user_count, COUNT(a) AS article_count
        MATCH ()-[r:READ|RATED]->()
        WITH user_count, article_count, COUNT(r) AS interaction_count
        MATCH (a:Article)
        WHERE a.quality_score IS NOT NULL
        RETURN user_count,
               article_count,
               interaction_count,
               AVG(a.quality_score) AS avg_quality
        """

        result = neo4j_manager.run_query(stats_query)
        stats = result[0] if result else {}

        # Get topic count
        topic_query = """
        MATCH (t:Topic)
        RETURN COUNT(t) AS topic_count
        """
        topic_result = neo4j_manager.run_query(topic_query)

        return SystemStatsResponse(
            total_articles=total_articles,
            total_users=stats.get("user_count", 0),
            total_interactions=stats.get("interaction_count", 0),
            avg_quality_score=stats.get("avg_quality", 0.0),
            topics_count=topic_result[0]["topic_count"] if topic_result else 0,
            database_status={
                "chromadb": "connected" if collection else "disconnected",
                "neo4j": "connected"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve system stats: {str(e)}")

@app.get("/api/system/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring
    """
    try:
        # Test ChromaDB connection
        collection = chroma_manager.get_collection()
        chroma_status = "healthy" if collection else "unhealthy"

        # Test Neo4j connection
        neo4j_manager.run_query("RETURN 1")
        neo4j_status = "healthy"

        return {
            "status": "healthy" if chroma_status == "healthy" and neo4j_status == "healthy" else "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "chromadb": chroma_status,
                "neo4j": neo4j_status
            }
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

@app.get("/api/system/topics", tags=["System"])
async def get_all_topics():
    """
    Get list of all available topics
    """
    try:
        query = """
        MATCH (t:Topic)
        OPTIONAL MATCH (a:Article {topic: t.name})
        WITH t, COUNT(a) AS article_count
        RETURN t.name AS topic, article_count
        ORDER BY article_count DESC
        """

        results = neo4j_manager.run_query(query)

        topics = [{"topic": row["topic"], "article_count": row["article_count"]} for row in results]

        return {"topics": topics, "count": len(topics)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve topics: {str(e)}")

# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    """
    API root endpoint
    """
    return {
        "message": "Skills Development API - Newsletter Agent System",
        "version": "1.0.0",
        "docs": "/api/docs",
        "endpoints": {
            "newsletter": "/api/newsletter/*",
            "recommendations": "/api/recommendations/*",
            "system": "/api/system/*"
        }
    }

@app.get("/health", tags=["Root"])
def health_check_simple():
    """Simple health check endpoint for monitoring."""
    return {"status": "ok"}

# ============================================================================
# Run Application
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
