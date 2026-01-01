from fastapi import APIRouter, File, HTTPException, UploadFile
import logging

from OCR_model import ModelLoadError, run_ocr

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
def get_translation():
    """Root endpoint for Automatic Translation microservice."""
    logger.info("[API] GET / - Health check")
    return {"message": "Automatic Translation Service"}


@router.post("/ocr/extract")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from an uploaded image using the OCR model."""

    logger.info(f"[API] POST /ocr/extract - Received file: {file.filename}")
    logger.info(f"[API] File size: {file.size} bytes, Content-Type: {file.content_type}")

    try:
        image_bytes = await file.read()
        logger.info(f"[API] Read {len(image_bytes)} bytes from upload")
        
        text = run_ocr(image_bytes)
        
        logger.info(f"[API] OCR completed successfully")
        return {"text": text}
        
    except ValueError as exc:
        logger.error(f"[API] Validation error: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))
    except ModelLoadError as exc:
        logger.error(f"[API] Model/API error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.error(f"[API] Unexpected error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
