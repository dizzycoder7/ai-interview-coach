from fastapi import APIRouter

router = APIRouter()

@router.get("")
@router.get("/")
async def health_check():
    return {"status": "ok", "service": "ai-engine"}

