from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_shadowing():
    return {"message": "Shadowing Module"}