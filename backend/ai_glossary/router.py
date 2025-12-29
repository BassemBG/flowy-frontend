from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_ai_glossary():
    return {"message": "AI Glossary Management Module"}