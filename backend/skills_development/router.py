from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_skills_development():
    return {"message": "Skills Development Module"}