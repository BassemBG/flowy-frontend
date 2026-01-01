# Project Folder Structure and Where to Add Your Work

The backend is organized as a microservices architecture. Each microservice has its own folder under `microservices/`, and the API gateway is in its own folder. When you contribute, you will find your service's folder and files already created for you.

**Folder and File Overview:**

- `microservices/<service_name>/` — Your microservice's code lives here.
  - `main.py` — The entry point for your FastAPI app. Imports and includes your router.
  - `router.py` — Where you define your endpoints using FastAPI's APIRouter. Add all your API routes here.
  - `requirements.txt` — List your service's Python dependencies here.
  - `Dockerfile` — Used to build your service's Docker image.
  - `.env` — Service-specific environment variables (do not commit secrets).
- `gateway/` — The API gateway that proxies requests to all microservices. Only update this if adding a new service or changing routing logic.
- `docker-compose.yml` — Orchestrates all services. Only update if adding/removing services.

**Where to Add Your Work:**

- Add new endpoints and logic in your service's `router.py`.
- If you need to add dependencies, update your service's `requirements.txt`.
- Only modify `main.py` if you need to change how your FastAPI app is initialized.
- Do not change files in other services' folders.
- Only update `gateway/main.py` and `docker-compose.yml` if you are adding a new service or changing global routing.

This structure ensures each team member can work independently on their own microservice without conflicts.

# Contributing to the Backend Microservices

Thank you for considering contributing! Please follow these guidelines to keep the project maintainable and consistent.

## Project Structure

- Each microservice lives in `microservices/<service_name>/` and is a standalone FastAPI app.
- The API gateway is in `gateway/` and proxies requests to microservices.

## Adding a New Microservice

1. **Create a new folder:**
   - `microservices/<your_service>/`
2. **Add these files:**
   - `main.py` (see other services for template)
   - `router.py` (**required**; must define a FastAPI `APIRouter` named `router` and include at least a root endpoint, see below)
   - `requirements.txt` (list only your service's dependencies)
   - `Dockerfile` (see other services for template)
   - `.env` (for service-specific environment variables)
3. **Example main.py:**

   ```python
   from fastapi import FastAPI
   from router import router

   app = FastAPI()
   app.include_router(router)
   ```

4. **Example router.py:**

   ```python
   from fastapi import APIRouter

   router = APIRouter()

   @router.get("/")
   def root():
       """Root endpoint for this microservice."""
       return {"message": "<Your Service Name> Service"}
   ```

5. **Update the gateway (only if needed):**
   - Only update `gateway/main.py` if you are adding a new microservice (add its name and URL to `MICROSERVICE_URLS`) or changing the routing logic for all services.
   - Do **not** change `gateway/main.py` for regular feature work in your microservice.
   - Add your service to `docker-compose.yml`.

## Environment Variables

- Place service-specific variables in `.env` inside your service folder.
- Do not commit secrets to the repository.

## Coding Standards

- Use clear, descriptive endpoint names and HTTP methods.
- Add docstrings to all endpoints.
- Write modular, testable code.

## Testing

- Add a `/health` endpoint for monitoring.
- Test your service locally before pushing.

## Pull Requests

- Describe your changes clearly.
- Reference related issues if applicable.
- Ensure your code passes linting and tests.

---

For questions, ask in the project chat or open an issue.
