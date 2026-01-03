from fastapi import APIRouter, UploadFile, File
import os
import shutil
from uuid import uuid4

from notekeeper_core.pipeline import run_notekeeper_pipeline

router = APIRouter()

UPLOAD_DIR = "/tmp/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/")
def get_notekeeper():
    """Root endpoint for AI NoteKeeper microservice."""
    return {"message": "AI NoteKeeper Service"}


@router.post("/run_notekeeper")
async def run_notekeeper(file: UploadFile = File(...)):
    filename = f"{uuid4()}_{file.filename}"
    audio_path = os.path.join(UPLOAD_DIR, filename)

    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = run_notekeeper_pipeline(audio_path)
    return result
