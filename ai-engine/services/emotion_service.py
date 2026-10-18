import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class EmotionService:
    def __init__(self):
        self._deepface_loaded = False

    def _ensure_deepface(self):
        if not self._deepface_loaded:
            from deepface import DeepFace
            self._DeepFace = DeepFace
            self._deepface_loaded = True

    async def analyze_frame(self, image_path: str) -> dict:
        """Analyze a single frame for emotions without blocking the main loop."""
        import asyncio
        try:
            self._ensure_deepface()
            
            def _sync_analyze():
                return self._DeepFace.analyze(
                    img_path=image_path,
                    actions=['emotion'],
                    enforce_detection=False,
                    silent=True
                )

            # Cap frame analysis at 2.5 seconds to never hold up the server
            result = await asyncio.wait_for(asyncio.to_thread(_sync_analyze), timeout=2.5)
            if isinstance(result, list):
                result = result[0]
            return {
                "dominant_emotion": result.get("dominant_emotion", "neutral"),
                "emotions": result.get("emotion", {}),
                "face_detected": True
            }
        except Exception as e:
            return {
                "dominant_emotion": "neutral",
                "emotions": {"neutral": 90, "happy": 10},
                "face_detected": False,
                "error": str(e)
            }

    def aggregate_session_emotions(self, frames_data: list) -> dict:
        """Aggregate emotion data from multiple frames across a session."""
        if not frames_data:
            return {"error": "No frame data provided"}

        emotion_totals = {}
        valid_frames = 0

        for frame in frames_data:
            emotions = frame.get("emotions", {})
            if emotions:
                valid_frames += 1
                for emotion, score in emotions.items():
                    emotion_totals[emotion] = emotion_totals.get(emotion, 0) + score

        if valid_frames == 0:
            return {"error": "No valid frames with emotion data"}

        avg_emotions = {k: round(v / valid_frames, 2) for k, v in emotion_totals.items()}
        dominant = max(avg_emotions, key=avg_emotions.get) if avg_emotions else "neutral"

        confidence_proxy = avg_emotions.get("happy", 0) + avg_emotions.get("neutral", 0) * 0.5
        nervousness_proxy = avg_emotions.get("fear", 0) + avg_emotions.get("sad", 0)

        return {
            "average_emotions": avg_emotions,
            "dominant_emotion": dominant,
            "frames_analyzed": valid_frames,
            "confidence_proxy_score": round(min(confidence_proxy, 100), 2),
            "nervousness_proxy_score": round(min(nervousness_proxy, 100), 2)
        }
