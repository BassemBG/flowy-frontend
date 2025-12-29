from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_automatic_translation():
    return {"message": "Automatic Translation Module"}