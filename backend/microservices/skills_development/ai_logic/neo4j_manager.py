import os
import time
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, SessionExpired, TransientError
from .logger import log
from dotenv import load_dotenv

load_dotenv()


class Neo4jManager:
    """Handles writing articles, users, ratings, and similarity edges to Neo4j."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "neo4j+s://21e8f92c.databases.neo4j.io")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD")

        if not hasattr(self, "driver"):
            log(f"🔌 Connecting to Neo4j at {self.uri}...")
            try:
                self.driver = GraphDatabase.driver(
                    self.uri,
                    auth=(self.user, self.password),
                    max_connection_lifetime=3600,  # 1 hour
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=60,  # 60 seconds
                    connection_timeout=30,  # 30 seconds
                )
                # Verify connectivity
                try:
                    self.driver.verify_connectivity()
                    log("✅ Neo4j connected successfully!")
                except Exception as conn_error:
                    log(f"⚠️  Neo4j connection failed: {conn_error}")
                    log("⚠️  Service will start but Neo4j features will be unavailable")
                    log(f"⚠️  URI: {self.uri}")
                    # Don't raise - allow service to start without Neo4j
            except Exception as e:
                log(f"❌ Failed to initialize Neo4j driver: {e}")
                log(f"⚠️  URI: {self.uri}")
                log(f"⚠️  User: {self.user}")
                # Don't raise - allow service to start without Neo4j

    # -----------------------------------------------------------
    # GENERIC QUERY EXECUTOR
    # -----------------------------------------------------------
    def run_query(self, query: str, **params):
        """Execute a query with retry logic for transient errors."""
        max_retries = 3
        retry_delay = 1  # seconds

        for attempt in range(max_retries):
            try:
                with self.driver.session() as session:
                    result = session.run(query, **params)
                    return [record.data() for record in result]
            except (ServiceUnavailable, SessionExpired, TransientError) as e:
                if attempt < max_retries - 1:
                    log(f"⚠️  Query failed (attempt {attempt + 1}/{max_retries}): {e}")
                    log(f"🔄 Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    log(f"❌ Query failed after {max_retries} attempts: {e}")
                    log(f"Query: {query[:100]}...")
                    raise
            except Exception as e:
                log(f"❌ Unexpected error in query execution: {e}")
                log(f"Query: {query[:100]}...")
                raise

    # -----------------------------------------------------------
    # USERS
    # -----------------------------------------------------------
    def add_user(self, user_id: str, name: str = "User"):
        query = """
            MERGE (u:User {user_id: $user_id})
            SET u.name = $name
        """
        self.run_query(query, user_id=user_id, name=name)

    def add_user_read(self, user_id: str, article_id: str):
        query = """
            MATCH (u:User {user_id: $user_id})
            MATCH (a:Article {article_id: $article_id})
            MERGE (u)-[:READ]->(a)
        """
        self.run_query(query, user_id=user_id, article_id=article_id)

    # -----------------------------------------------------------
    # ARTICLES
    # -----------------------------------------------------------
    def add_article(self, article_id: str, title: str, topic: str, created_at: str):
        query = """
            MERGE (a:Article {article_id: $article_id})
            SET a.title = $title,
                a.topic = $topic,
                a.created_at = $created_at
        """
        self.run_query(query, article_id=article_id, title=title, topic=topic, created_at=created_at)

    # -----------------------------------------------------------
    # RATINGS
    # -----------------------------------------------------------
    def add_rating(self, user_id: str, article_id: str, rating: float):
        query = """
            MATCH (u:User {user_id: $user_id})
            MATCH (a:Article {article_id: $article_id})
            MERGE (u)-[r:RATED]->(a)
            SET r.score = $rating
        """
        self.run_query(query, user_id=user_id, article_id=article_id, rating=rating)

    # -----------------------------------------------------------
    # TOPIC AFFINITY
    # -----------------------------------------------------------
    def increment_topic_affinity(self, user_id: str, topic: str):
        query = """
            MERGE (u:User {user_id: $user_id})
            MERGE (t:Topic {name: $topic})
            MERGE (u)-[r:INTERESTED_IN]->(t)
            SET r.score = coalesce(r.score, 0) + 1
        """
        self.run_query(query, user_id=user_id, topic=topic)

    # -----------------------------------------------------------
    # SIMILARITY GRAPH
    # -----------------------------------------------------------
    def set_similarity(self, article1: str, article2: str, score: float):
        query = """
            MATCH (a1:Article {article_id: $a1})
            MATCH (a2:Article {article_id: $a2})
            MERGE (a1)-[s:SIMILAR_TO]->(a2)
            SET s.score = $score
        """
        self.run_query(query, a1=article1, a2=article2, score=score)

    # -----------------------------------------------------------
    # RECOMMENDATIONS
    # -----------------------------------------------------------
    def get_user_recommendations(self, user_id: str, limit: int = 10):
        """
        Return recommended article_ids for a user:
        • similarity-based recs
        • topic-based recs
        """

        query = """
        // 1. User read articles → ids and topics
        MATCH (u:User {user_id: $user_id})-[:READ]->(ra:Article)
        WITH COLLECT(DISTINCT ra.article_id) AS read_ids,
            COLLECT(DISTINCT ra.topic) AS read_topics

        // 2. Similar articles
        UNWIND read_ids AS rid
        OPTIONAL MATCH (:Article {article_id: rid})-[:SIMILAR_TO]->(sim:Article)
        WITH read_ids, read_topics, COLLECT(DISTINCT sim.article_id) AS sim_ids

        // 3. Topic-based recommended articles
        UNWIND read_topics AS rt
        OPTIONAL MATCH (other:Article {topic: rt})
        WITH read_ids, sim_ids, COLLECT(DISTINCT other.article_id) AS topic_ids

        // 4. Merge & UNWIND while keeping read_ids in scope
        WITH read_ids, sim_ids + topic_ids AS merged
        UNWIND merged AS rec
        WITH rec, read_ids                      // keep read_ids alive

        WHERE rec IS NOT NULL AND NOT rec IN read_ids
        RETURN DISTINCT rec
        LIMIT $limit
        """

        result = self.run_query(query, user_id=user_id, limit=limit)
        return [row["rec"] for row in result]



# Singleton
neo4j_manager = Neo4jManager()
