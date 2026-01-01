# Backend

This backend uses a microservices architecture with FastAPI. Each service runs in its own container and is managed via Docker Compose. The gateway service proxies all frontend requests to the appropriate microservice.

**Microservices:**

- WhatsApp Agent
- AI Glossary Management
- Automatic Translation
- Skills Development
- AI NoteKeeper
- Shadowing

## Setup

## Running the Backend

1. **Build and start all services with Docker Compose:**

   ```bash
   docker-compose up --build
   ```

   This will start the gateway and all microservices. The gateway will be available at http://localhost:8000.

2. **Accessing Services:**

   - The frontend should send all API requests to the gateway (e.g., `http://localhost:8000/ai_glossary/`).
   - Each microservice runs independently and can have its own dependencies and environment variables.

3. **Development (optional):**
   - To run a microservice locally for development, navigate to its folder and run:
     ```bash
     pip install -r requirements.txt
     uvicorn main:app --reload
     ```

## Environment Variables

Each microservice can have its own `.env` file in its folder for service-specific environment variables. Example:

```
microservices/ai_glossary/.env
microservices/whatsapp_agent/.env
...
```

These are loaded automatically by Docker Compose for each service.
