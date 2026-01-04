"""API Router for AI Glossary microservice."""
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException

from schemas import (
    FileUploadResponse,
    FileListResponse,
    FileDeleteResponse,
    SearchRequest,
    GlossarySearchResponse,
    GlossaryResult,
    ManagedFile,
    WebSearchResponse,
    WebResult,
)
from services.file_service import parse_file
from services.chroma_service import (
    embed_glossary_file,
    search_glossary,
    delete_file_embeddings,
    get_all_files,
    get_file_by_id,
)
from services.web_search_service import search_web

router = APIRouter()


@router.get("/")
def get_glossary():
    """Root endpoint for AI Glossary microservice."""
    return {"message": "AI Glossary Service", "version": "1.0.0"}


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and embed an Excel/CSV glossary file into ChromaDB.
    
    Accepts .xlsx, .xls, or .csv files with Term/Definition columns.
    """
    # Validate file extension
    filename = file.filename or "unknown"
    if not any(filename.lower().endswith(ext) for ext in ['.xlsx', '.xls', '.csv']):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload .xlsx, .xls, or .csv files"
        )
    
    # Read file content
    try:
        content = await file.read()
        file_size = len(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Parse file
    try:
        terms = parse_file(content, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if not terms:
        raise HTTPException(
            status_code=400,
            detail="No valid terms found in the file. Ensure it has columns for Term and Definition."
        )
    
    # Generate file ID and embed
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    
    try:
        terms_count = embed_glossary_file(file_id, filename, terms, file_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error embedding terms: {str(e)}")
    
    return FileUploadResponse(
        id=file_id,
        name=filename,
        size=file_size,
        uploaded_at=datetime.utcnow(),
        terms_count=terms_count,
        status="embedded",
        message=f"Successfully embedded {terms_count} terms into the glossary"
    )


@router.get("/files", response_model=FileListResponse)
async def list_files():
    """Get all uploaded glossary files."""
    files = get_all_files()
    
    managed_files = []
    for f in files:
        try:
            uploaded_at = datetime.fromisoformat(f["uploaded_at"]) if f.get("uploaded_at") else datetime.utcnow()
        except (ValueError, TypeError):
            uploaded_at = datetime.utcnow()
        
        managed_files.append(ManagedFile(
            id=f["id"],
            name=f["name"],
            size=f.get("size", 0),
            uploaded_at=uploaded_at,
            terms_count=f.get("terms_count", 0)
        ))
    
    return FileListResponse(
        files=managed_files,
        total_count=len(managed_files)
    )


@router.delete("/files/{file_id}", response_model=FileDeleteResponse)
async def delete_file(file_id: str):
    """Delete a glossary file and its embeddings from ChromaDB."""
    # Check if file exists
    file_info = get_file_by_id(file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail=f"File not found: {file_id}")
    
    # Delete embeddings
    deleted_count = delete_file_embeddings(file_id)
    
    return FileDeleteResponse(
        message="File and associated embeddings deleted successfully",
        deleted_terms_count=deleted_count
    )


@router.post("/search/glossary", response_model=GlossarySearchResponse)
async def search_glossary_endpoint(request: SearchRequest):
    """
    Search for terms in the embedded glossary using semantic search.
    
    Returns matching terms with similarity scores. No generative LLM is used;
    the answer field contains a formatted summary of top results.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    # Perform semantic search
    try:
        results = search_glossary(request.query, request.top_k)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")
    
    # Format results
    glossary_results = [
        GlossaryResult(
            term=r["term"],
            definition=r["definition"],
            score=r["score"],
            source_file=r["source_file"]
        )
        for r in results
    ]
    
    # Generate simple answer from results (no LLM)
    if glossary_results:
        top_result = glossary_results[0]
        answer = f"**{top_result.term}**: {top_result.definition}"
        if len(glossary_results) > 1:
            answer += f"\n\n*Found {len(glossary_results)} related terms.*"
    else:
        answer = "No matching terms found in the glossary."
    
    return GlossarySearchResponse(
        query=request.query,
        results=glossary_results,
        answer=answer,
        mode="glossary"
    )


@router.post("/search/web", response_model=WebSearchResponse)
async def search_web_endpoint(request: SearchRequest):
    """
    Search the internet for a term definition using DuckDuckGo + Groq LLM.
    
    Returns web results with an AI-generated answer synthesized from the results.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        result = search_web(request.query, request.top_k)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Web search error: {str(e)}")
    
    # Format results
    web_results = [
        WebResult(
            title=r["title"],
            snippet=r["snippet"],
            url=r["url"]
        )
        for r in result["results"]
    ]
    
    return WebSearchResponse(
        query=result["query"],
        results=web_results,
        answer=result["answer"],
        mode="web"
    )
