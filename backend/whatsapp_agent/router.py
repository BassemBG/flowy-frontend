from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_whatsapp_agent():
    return {"message": "WhatsApp Agent Module"}