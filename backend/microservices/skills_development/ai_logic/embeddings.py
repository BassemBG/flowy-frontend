"""
Embedding Service
Centralized embedding generation for consistency across the system.
"""

from sentence_transformers import SentenceTransformer
from typing import List, Union
import numpy as np

class EmbeddingService:
    """Singleton service for generating embeddings."""
    
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize the embedding model."""
        if self._model is None:
            print(f"🔄 Loading embedding model: {model_name}")
            self._model = SentenceTransformer(model_name)
            print("✅ Embedding model loaded")
    
    def embed(self, text: Union[str, List[str]], normalize: bool = True) -> Union[np.ndarray, List[np.ndarray]]:
        """
        Generate embeddings for text(s).
        
        Args:
            text: Single text or list of texts
            normalize: Whether to normalize embeddings
        
        Returns:
            Embedding(s) as numpy array
        """
        return self._model.encode(
            text,
            normalize_embeddings=normalize,
            show_progress_bar=False
        )
    
    def embed_batch(self, texts: List[str], normalize: bool = True, batch_size: int = 32) -> np.ndarray:
        """
        Generate embeddings for batch of texts efficiently.
        
        Args:
            texts: List of texts
            normalize: Whether to normalize embeddings
            batch_size: Batch size for processing
        
        Returns:
            Array of embeddings
        """
        return self._model.encode(
            texts,
            normalize_embeddings=normalize,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 10
        )
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
        
        Returns:
            Similarity score (0-1)
        """
        # Ensure normalized
        norm1 = embedding1 / (np.linalg.norm(embedding1) + 1e-10)
        norm2 = embedding2 / (np.linalg.norm(embedding2) + 1e-10)
        
        return float(np.dot(norm1, norm2))
    
    def compute_similarity_matrix(self, embeddings: np.ndarray) -> np.ndarray:
        """
        Compute pairwise similarity matrix for a set of embeddings.
        
        Args:
            embeddings: Array of embeddings (n_samples, embedding_dim)
        
        Returns:
            Similarity matrix (n_samples, n_samples)
        """
        # Normalize
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        normalized = embeddings / (norms + 1e-10)
        
        # Compute cosine similarity matrix
        return np.dot(normalized, normalized.T)


# Singleton instance
embedding_service = EmbeddingService()