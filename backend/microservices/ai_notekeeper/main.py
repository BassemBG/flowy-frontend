from fastapi import FastAPI
from routes.ai_notekeeper import router as notekeeper_router

app = FastAPI(title="API Gateway")

app.include_router(notekeeper_router)

@app.get("/health")
def health():
    return {"status": "gateway running"}
