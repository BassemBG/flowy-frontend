from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_ai_notekeeper():
    return {"message": "AI NoteKeeper Module"}