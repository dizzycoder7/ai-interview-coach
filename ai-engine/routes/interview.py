from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Union, Any
from services.llm_service import LLMService

router = APIRouter()
llm = LLMService()

class StartInterviewRequest(BaseModel):
    interview_type: str  # TECHNICAL, BEHAVIORAL, CODING, MIXED
    resume_text: Optional[str] = None
    candidate_name: Optional[str] = "Candidate"
    experience_level: Optional[str] = "JUNIOR"  # JUNIOR, MID, SENIOR

class EvaluateAnswerRequest(BaseModel):
    session_id: Union[str, int]
    question: str
    answer_text: str
    interview_type: str
    conversation_history: Optional[list] = []
    resume_text: Optional[str] = None
    experience_level: Optional[str] = "JUNIOR"  # JUNIOR, MID, SENIOR
    conversational_turn: Optional[int] = 0
    interviewer_persona: Optional[str] = "STRICT_CAMPUS"
    root_question: Optional[str] = None

class ScoreSessionRequest(BaseModel):
    session_id: Union[str, int]
    qa_pairs: list
    emotion_data: Optional[dict] = None
    eye_contact_score: Optional[float] = None
    filler_word_count: Optional[int] = 0
    experience_level: Optional[str] = "JUNIOR"

@router.post("/start")
async def start_interview(req: StartInterviewRequest):
    """Generate the opening question for the interview."""
    try:
        result = await llm.generate_opening_question(
            interview_type=req.interview_type,
            resume_text=req.resume_text,
            candidate_name=req.candidate_name,
            experience_level=req.experience_level or "JUNIOR"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate")
async def evaluate_answer(req: EvaluateAnswerRequest):
    """Evaluate an answer with dynamic follow-up probing and dimension scoring."""
    try:
        result = await llm.evaluate_and_followup(
            question=req.question,
            answer=req.answer_text,
            interview_type=req.interview_type,
            history=req.conversation_history,
            resume_text=req.resume_text,
            experience_level=req.experience_level or "JUNIOR",
            conversational_turn=req.conversational_turn or 0,
            interviewer_persona=req.interviewer_persona or "STRICT_CAMPUS",
            root_question=req.root_question
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/score")
async def score_session(req: ScoreSessionRequest):
    """Generate a final scorecard for the session."""
    try:
        result = await llm.generate_scorecard(
            qa_pairs=req.qa_pairs,
            emotion_data=req.emotion_data,
            eye_contact_score=req.eye_contact_score,
            filler_word_count=req.filler_word_count
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class WarmupGenerateRoundRequest(BaseModel):
    track: Optional[str] = "SOFTWARE_ENGINEERING"
    job_description: Optional[str] = None
    candidate_name: Optional[str] = "Candidate"


class WarmupAnalyzeAnswerRequest(BaseModel):
    question: str
    answer_text: str
    category: Optional[str] = "TECHNICAL"
    track: Optional[str] = "SOFTWARE_ENGINEERING"
    target_terms: Optional[list] = []
    talking_points: Optional[list] = []


@router.post("/warmup/generate-round")
async def warmup_generate_round(req: WarmupGenerateRoundRequest):
    """Generate or customize a 5-question Google-style warmup session (1 Background, 2 Situational, 2 Technical)."""
    try:
        result = await llm.generate_warmup_round(
            track=req.track or "SOFTWARE_ENGINEERING",
            job_description=req.job_description,
            candidate_name=req.candidate_name or "Candidate"
        )
        return {"questions": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/warmup/analyze-answer")
async def warmup_analyze_answer(req: WarmupAnalyzeAnswerRequest):
    """Analyze answer using non-judgmental ML pattern recognition (Job-related terms, most-used words, talking points)."""
    try:
        result = await llm.analyze_warmup_answer(
            question=req.question,
            answer_text=req.answer_text,
            category=req.category or "TECHNICAL",
            track=req.track or "SOFTWARE_ENGINEERING",
            target_terms=req.target_terms or [],
            talking_points=req.talking_points or []
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

