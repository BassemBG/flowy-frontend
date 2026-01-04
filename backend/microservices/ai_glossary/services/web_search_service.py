"""Web search service using DuckDuckGo + Groq Cloud API."""
import httpx
import logging
import re
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass

from config import settings

logger = logging.getLogger(__name__)

# Groq API endpoint (OpenAI-compatible)
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Arabic character detection regex
ARABIC_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")


def detect_language(text: str) -> Tuple[str, str]:
    """
    Detect if text is Arabic or French and return (source_lang, target_lang).
    
    Returns:
        Tuple of (source_lang, target_lang) e.g. ("ar", "fr") or ("fr", "ar")
    """
    if ARABIC_RE.search(text):
        return ("ar", "fr")  # Arabic -> French
    else:
        return ("fr", "ar")  # French -> Arabic


@dataclass
class WebResult:
    """Single web search result."""
    title: str
    url: str
    snippet: str


def search_duckduckgo(query: str, limit: int = 5) -> List[WebResult]:
    """
    Search DuckDuckGo for web results.
    
    Args:
        query: Search query
        limit: Max results to return
        
    Returns:
        List of WebResult objects
    """
    results = []
    
    try:
        # Try ddgs package first (newer)
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS
        
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=limit):
                results.append(WebResult(
                    title=r.get("title", "") or "",
                    url=r.get("href", "") or "",
                    snippet=r.get("body", "") or "",
                ))
    except Exception as e:
        logger.error(f"DuckDuckGo search failed: {e}")
        # Return empty results on failure
    
    logger.info(f"DuckDuckGo search for '{query}' returned {len(results)} results")
    return results


def groq_translate(term: str, src_lang: str, tgt_lang: str, web_results: List[WebResult]) -> str:
    """
    Use Groq Cloud API to extract and synthesize translation from web search results.
    
    Args:
        term: Original term to translate
        src_lang: Source language code (ar/fr)
        tgt_lang: Target language code (ar/fr)
        web_results: List of web search results
        
    Returns:
        AI-generated translation answer
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    # Format web results for context
    context = "\n\n".join([
        f"**{r.title}**\n{r.snippet}\nSource: {r.url}"
        for r in web_results[:5]
    ])
    
    if not context:
        context = "No web results found."
    
    # Language names for prompts
    lang_names = {"ar": "Arabic (العربية)", "fr": "French (Français)"}
    src_name = lang_names.get(src_lang, src_lang)
    tgt_name = lang_names.get(tgt_lang, tgt_lang)
    
    # Build translation-focused prompt with structured output
    system_prompt = f"""You are a professional translator specialized in {src_name} ↔ {tgt_name} translation.
Your task is to find and provide the best translation for the given term.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

## 🎯 Main Translation
**[TRANSLATION]** — Confidence: [X]%

## 📚 Alternative Translations
1. **[ALT1]** — [X]% — [context when to use]
2. **[ALT2]** — [X]% — [context when to use]

## 📖 Definition
[Brief explanation of the term]

## 🏷️ Domain
[legal/medical/technical/general/etc.]

RULES:
- Confidence scores: 90-100% = verified in sources, 70-89% = likely correct, 50-69% = uncertain
- Always provide the Arabic in Arabic script and French in French
- Be concise but complete"""

    user_prompt = f"""Translate this {src_name} term to {tgt_name}: **"{term}"**

Web search results:
{context}

Provide the translation with confidence scores based on how well it matches the web sources."""

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,  # Lower for more consistent translations
        "max_tokens": 1024
    }
    
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            answer = data["choices"][0]["message"]["content"]
            logger.info(f"Groq generated translation for '{term}' ({src_lang} -> {tgt_lang})")
            return answer
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Groq API error: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"Groq API request failed: {e}")
        raise


def search_web(query: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Translation-focused web search: detects language and searches for translation.
    
    If given French -> searches for Arabic translation
    If given Arabic -> searches for French translation
    
    Args:
        query: Term to translate
        top_k: Number of web results to fetch
        
    Returns:
        Dict with query, results, answer, mode, direction
    """
    # Step 1: Detect language direction
    src_lang, tgt_lang = detect_language(query)
    
    # Language names for search query
    lang_map = {"ar": "arabe", "fr": "français"}
    src_name = lang_map.get(src_lang, src_lang)
    tgt_name = lang_map.get(tgt_lang, tgt_lang)
    
    # Step 2: Build translation-focused search queries
    search_query = f'"{query}" traduction {src_name} {tgt_name}'
    logger.info(f"Translation search: '{query}' ({src_lang} -> {tgt_lang})")
    
    # Step 3: Search DuckDuckGo
    web_results = search_duckduckgo(search_query, limit=top_k)
    
    # Also try alternate query format
    if len(web_results) < 3:
        alt_query = f'"{query}" translation {src_lang} {tgt_lang}'
        alt_results = search_duckduckgo(alt_query, limit=3)
        # Add unique results
        existing_urls = {r.url for r in web_results}
        for r in alt_results:
            if r.url not in existing_urls:
                web_results.append(r)
    
    # Step 4: Generate translation with Groq
    if web_results:
        try:
            answer = groq_translate(query, src_lang, tgt_lang, web_results)
        except Exception as e:
            answer = f"Unable to generate translation: {str(e)}"
    else:
        answer = f"No translation results found for '{query}'. Please try a different term."
    
    # Format results
    formatted_results = [
        {
            "title": r.title,
            "snippet": r.snippet,
            "url": r.url
        }
        for r in web_results
    ]
    
    return {
        "query": query,
        "results": formatted_results,
        "answer": answer,
        "mode": "web",
        "direction": f"{src_lang} -> {tgt_lang}"
    }
