from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import interview, speech, emotion, resume, health

app = FastAPI(
    title="AI Interview Engine",
    description="AI microservice for the AI Interview Coach platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(speech.router, prefix="/speech", tags=["Speech"])
app.include_router(emotion.router, prefix="/emotion", tags=["Emotion"])
app.include_router(resume.router, prefix="/resume", tags=["Resume"])

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
