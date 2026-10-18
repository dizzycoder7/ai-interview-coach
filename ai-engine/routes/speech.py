from fastapi import APIRouter, UploadFile, File, HTTPException
from services.speech_service import SpeechService
import tempfile, os

router = APIRouter()
speech_svc = SpeechService()

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe uploaded audio using OpenAI Whisper."""
    try:
        contents = await audio.read()
        suffix = os.path.splitext(audio.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        result = await speech_svc.transcribe_whisper(tmp_path)
        os.unlink(tmp_path)
        return {"transcript": result, "source": "whisper"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-filler-words")
async def analyze_filler_words(payload: dict):
    """Detect filler words in a transcript."""
    text = payload.get("text", "")
    result = speech_svc.detect_filler_words(text)
    return result
