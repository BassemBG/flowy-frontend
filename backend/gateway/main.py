# Example Gateway FastAPI App
# This service proxies requests to backend microservices.
# To add a new microservice, add its name and URL to MICROSERVICE_URLS.

from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# CORS Configuration - Allow frontend to access gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MICROSERVICE_URLS = {
    "whatsapp_agent": "http://whatsapp_agent:8000",
    "ai_glossary": "http://ai_glossary:8000",
    "ai_notekeeper": "http://ai_notekeeper:8000",
    "automatic_translation": "http://automatic_translation:8000",
    "skills_development": "http://skills_development:8000",
    "shadowing": "http://shadowing:8000",
}


@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    """
    Proxies requests to the appropriate microservice.
    Example: /ai_glossary/some-endpoint -> http://ai_glossary:8000/some-endpoint
    Handles form data and file uploads correctly.
    """
    if service not in MICROSERVICE_URLS:
        return {"error": "Unknown service"}
    
    url = f"{MICROSERVICE_URLS[service]}/{path}"
    
    # Forward headers (excluding Host which should be set by httpx)
    headers = {}
    for key, value in request.headers.items():
        if key.lower() not in ("host", "content-length"):
            headers[key] = value
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.request(
            request.method, 
            url,
            headers=headers,
            params=dict(request.query_params),
            content=await request.body() if request.method != "GET" else None,
        )
    
    # Forward the response from the microservice
    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=dict(response.headers),
    )


# To add a new microservice:
# 1. Add its name and URL to MICROSERVICE_URLS above.
# 2. Make sure it is included in docker-compose.yml and running.
