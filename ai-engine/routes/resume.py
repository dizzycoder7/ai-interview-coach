from fastapi import APIRouter, UploadFile, File, HTTPException
from services.resume_service import ResumeService
import tempfile, os

router = APIRouter()
resume_svc = ResumeService()

@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """Parse a resume PDF/DOCX and extract skills and experience."""
    try:
        contents = await file.read()
        filename = file.filename or "resume.pdf"
        result = await resume_svc.parse_bytes(contents, filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

