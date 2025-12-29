from fastapi import FastAPI

# Create the FastAPI app
app = FastAPI()

# Include routers for each module
from whatsapp_agent.router import router as whatsapp_router
from ai_glossary.router import router as glossary_router
from automatic_translation.router import router as translation_router
from skills_development.router import router as skills_router
from ai_notekeeper.router import router as notekeeper_router
from shadowing.router import router as shadowing_router

app.include_router(whatsapp_router, prefix="/whatsapp", tags=["WhatsApp Agent"])
app.include_router(glossary_router, prefix="/glossary", tags=["AI Glossary Management"])
app.include_router(translation_router, prefix="/translation", tags=["Automatic Translation"])
app.include_router(skills_router, prefix="/skills", tags=["Skills Development"])
app.include_router(notekeeper_router, prefix="/notekeeper", tags=["AI NoteKeeper"])
app.include_router(shadowing_router, prefix="/shadowing", tags=["Shadowing"])

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI backend!"}