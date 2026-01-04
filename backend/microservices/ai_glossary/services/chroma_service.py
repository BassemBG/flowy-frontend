"""ChromaDB vector store service for glossary terms."""
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Optional
import logging
from datetime import datetime
import json

from config import settings
from services.embedding_service import embed_texts, embed_single

logger = logging.getLogger(__name__)

# Module-level client and collection
_client = None
_collection = None


def _get_client() -> chromadb.Client:
    """Initialize ChromaDB client (singleton)."""
    global _client
    if _client is None:
        logger.info(f"Initializing ChromaDB at: {settings.CHROMA_PERSIST_DIRECTORY}")
        _client = chromadb.Client(
            ChromaSettings(
                is_persistent=True,
                persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
                anonymized_telemetry=False,
            )
        )
    return _client


def get_collection():
    """Get or create the glossary collection."""
    global _collection
    if _collection is None:
        client = _get_client()
        _collection = client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION,
            metadata={"description": "Glossary terms and definitions"}
        )
    return _collection


def embed_glossary_file(file_id: str, filename: str, terms: List[Dict], file_size: int) -> int:
    """
    Embed glossary terms into ChromaDB.
    
    Args:
        file_id: Unique identifier for the uploaded file
        filename: Original filename
        terms: List of {"term": ..., "definition": ...} dicts
        file_size: File size in bytes
        
    Returns:
        Number of terms embedded
    """
    if not terms:
        return 0
    
    collection = get_collection()
    
    documents = []
    metadatas = []
    ids = []
    
    upload_time = datetime.utcnow().isoformat()
    
    for i, term in enumerate(terms):
        # Combine term and definition for better semantic search
        doc_text = f"{term['term']}: {term['definition']}"
        documents.append(doc_text)
        metadatas.append({
            "term": term["term"],
            "definition": term["definition"],
            "file_id": file_id,
            "filename": filename,
            "file_size": file_size,
            "uploaded_at": upload_time,
        })
        ids.append(f"{file_id}_{i}")
    
    logger.info(f"Preparing to index {len(documents)} terms from file {filename}")
    
    # Batch process embeddings
    batch_size = 50  # HuggingFace API friendly batch size
    
    for i in range(0, len(documents), batch_size):
        batch_ids = ids[i:i+batch_size]
        batch_docs = documents[i:i+batch_size]
        batch_metas = metadatas[i:i+batch_size]
        
        logger.info(f"Embedding batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}")
        embeddings = embed_texts(batch_docs)
        
        # Add to collection
        collection.add(
            ids=batch_ids,
            documents=batch_docs,
            metadatas=batch_metas,
            embeddings=embeddings,
        )
    
    logger.info(f"Successfully indexed {len(documents)} terms from {filename}")
    return len(documents)


def search_glossary(query: str, top_k: int = 3) -> List[Dict]:
    """
    Semantic search in the glossary collection.
    
    Args:
        query: Search query text
        top_k: Number of results to return (default 3)
        
    Returns:
        List of result dictionaries with term, definition, score, source_file
    """
    collection = get_collection()
    
    # Check if collection has any documents
    count = collection.count()
    logger.info(f"Collection has {count} documents")
    
    if count == 0:
        logger.warning("No documents in collection!")
        return []
    
    # Embed query
    query_embedding = embed_single(query)
    if not query_embedding:
        logger.error("Failed to embed query")
        return []
    
    # Query ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, count),
        include=["documents", "metadatas", "distances"]
    )
    
    logger.info(f"Raw results: {results}")
    
    formatted_results = []
    if results["ids"] and len(results["ids"]) > 0 and len(results["ids"][0]) > 0:
        for i, metadata in enumerate(results["metadatas"][0]):
            # Convert distance to similarity score
            # ChromaDB uses L2 distance by default, lower = more similar
            distance = results["distances"][0][i]
            # Convert L2 distance to a 0-1 similarity score
            score = 1 / (1 + distance)  # Inverse transform for better scoring
            
            logger.info(f"Result {i}: term={metadata['term']}, distance={distance}, score={score}")
            
            formatted_results.append({
                "term": metadata["term"],
                "definition": metadata["definition"],
                "score": round(score, 3),
                "source_file": metadata.get("filename", "unknown")
            })
    
    logger.info(f"Search for '{query}' returned {len(formatted_results)} results")
    return formatted_results


def delete_file_embeddings(file_id: str) -> int:
    """
    Delete all embeddings associated with a file.
    
    Args:
        file_id: File ID to delete embeddings for
        
    Returns:
        Number of deleted embeddings
    """
    collection = get_collection()
    
    # Get all IDs for this file
    results = collection.get(
        where={"file_id": file_id},
        include=["metadatas"]
    )
    
    if results["ids"]:
        collection.delete(ids=results["ids"])
        logger.info(f"Deleted {len(results['ids'])} embeddings for file {file_id}")
        return len(results["ids"])
    
    return 0


def get_all_files() -> List[Dict]:
    """
    Get metadata for all uploaded files.
    
    Returns:
        List of unique file metadata dictionaries
    """
    collection = get_collection()
    
    # Get all documents to extract unique files
    results = collection.get(include=["metadatas"])
    
    if not results["metadatas"]:
        return []
    
    # Aggregate by file_id
    files_dict = {}
    for metadata in results["metadatas"]:
        file_id = metadata.get("file_id")
        if file_id and file_id not in files_dict:
            files_dict[file_id] = {
                "id": file_id,
                "name": metadata.get("filename", "unknown"),
                "size": metadata.get("file_size", 0),
                "uploaded_at": metadata.get("uploaded_at", ""),
                "terms_count": 0
            }
        if file_id:
            files_dict[file_id]["terms_count"] += 1
    
    return list(files_dict.values())


def get_file_by_id(file_id: str) -> Optional[Dict]:
    """
    Get metadata for a specific file.
    
    Args:
        file_id: File ID to look up
        
    Returns:
        File metadata dict or None if not found
    """
    files = get_all_files()
    for f in files:
        if f["id"] == file_id:
            return f
    return None
