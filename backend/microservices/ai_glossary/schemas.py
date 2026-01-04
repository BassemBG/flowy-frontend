"""Pydantic schemas for AI Glossary API."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Literal


# ============================================================================
# File Management
# ============================================================================

class FileUploadResponse(BaseModel):
    """Response after uploading a glossary file."""
    id: str
    name: str
    size: int
    uploaded_at: datetime
    terms_count: int
    status: str
    message: str


class ManagedFile(BaseModel):
    """Metadata for a managed glossary file."""
    id: str
    name: str
    size: int
    uploaded_at: datetime
    terms_count: int


class FileListResponse(BaseModel):
    """Response containing list of all uploaded files."""
    files: List[ManagedFile]
    total_count: int


class FileDeleteResponse(BaseModel):
    """Response after deleting a file."""
    message: str
    deleted_terms_count: int


# ============================================================================
# Search
# ============================================================================

class SearchRequest(BaseModel):
    """Request for glossary or web search."""
    query: str
    top_k: int = 5


class GlossaryResult(BaseModel):
    """Single result from glossary search."""
    term: str
    definition: str
    score: float
    source_file: str


class GlossarySearchResponse(BaseModel):
    """Response from glossary search."""
    query: str
    results: List[GlossaryResult]
    answer: str
    mode: Literal["glossary"] = "glossary"


class WebResult(BaseModel):
    """Single result from web search."""
    title: str
    snippet: str
    url: str


class WebSearchResponse(BaseModel):
    """Response from web search."""
    query: str
    results: List[WebResult]
    answer: str
    mode: Literal["web"] = "web"


# ============================================================================
# Chat (Optional Unified Interface)
# ============================================================================

class ChatRequest(BaseModel):
    """Request for unified chat endpoint."""
    message: str
    mode: Literal["glossary", "web"]
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    id: str
    role: Literal["assistant"] = "assistant"
    content: str
    timestamp: datetime
    mode: Literal["glossary", "web"]
    sources: Optional[List[GlossaryResult]] = None
