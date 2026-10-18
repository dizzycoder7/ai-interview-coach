from fastapi import APIRouter, UploadFile, File, HTTPException
from services.emotion_service import EmotionService
import tempfile, os

router = APIRouter()
emotion_svc = EmotionService()

@router.post("/analyze-frame")
async def analyze_frame(image: UploadFile = File(...)):
    """Analyze a single webcam frame for emotion and facial metrics."""
    try:
        contents = await image.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        result = await emotion_svc.analyze_frame(tmp_path)
        os.unlink(tmp_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-session")
async def analyze_session_emotions(payload: dict):
    """Aggregate emotion data across a session."""
    frames_data = payload.get("frames", [])
    result = emotion_svc.aggregate_session_emotions(frames_data)
    return result
