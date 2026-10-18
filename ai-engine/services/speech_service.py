import os
import re
from dotenv import load_dotenv

load_dotenv()

FILLER_WORDS = [
    "um", "uh", "like", "you know", "so", "basically", "literally",
    "actually", "right", "okay", "well", "kind of", "sort of",
    "i mean", "you see", "let me think", "hmm"
]

class SpeechService:
    def __init__(self):
        self._whisper_model = None  # Lazy load

    def _load_whisper(self):
        if self._whisper_model is None:
            import whisper
            model_size = os.getenv("WHISPER_MODEL", "base")
            self._whisper_model = whisper.load_model(model_size)
        return self._whisper_model

    async def transcribe_whisper(self, audio_path: str) -> str:
        """Transcribe audio file using local OpenAI Whisper."""
        try:
            model = self._load_whisper()
            result = model.transcribe(audio_path)
            return result["text"].strip()
        except Exception as e:
            raise RuntimeError(f"Whisper transcription failed: {e}")

    def detect_filler_words(self, text: str) -> dict:
        """Count filler words in a transcript."""
        text_lower = text.lower()
        total_count = 0
        breakdown = {}
        for word in FILLER_WORDS:
            pattern = r'\b' + re.escape(word) + r'\b'
            count = len(re.findall(pattern, text_lower))
            if count > 0:
                breakdown[word] = count
                total_count += count
        word_count = len(text.split())
        filler_percentage = round((total_count / word_count * 100), 2) if word_count else 0
        return {
            "total_filler_count": total_count,
            "filler_percentage": filler_percentage,
            "breakdown": breakdown,
            "word_count": word_count,
            "assessment": "Excellent" if filler_percentage < 2 else ("Good" if filler_percentage < 5 else ("Needs Improvement" if filler_percentage < 10 else "Poor"))
        }
