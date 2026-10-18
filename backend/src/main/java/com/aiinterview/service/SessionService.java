package com.aiinterview.service;

import com.aiinterview.dto.CreateSessionRequest;
import com.aiinterview.dto.SaveQARequest;
import com.aiinterview.entity.InterviewQA;
import com.aiinterview.entity.InterviewSession;
import com.aiinterview.entity.SessionAnalysis;
import com.aiinterview.repository.InterviewQARepository;
import com.aiinterview.repository.InterviewSessionRepository;
import com.aiinterview.repository.SessionAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final InterviewSessionRepository sessionRepo;
    private final InterviewQARepository qaRepo;
    private final SessionAnalysisRepository analysisRepo;

    @Transactional
    public InterviewSession createSession(CreateSessionRequest req) {
        InterviewSession session = new InterviewSession();
        session.setUserId(req.getUserId());
        session.setInterviewType(InterviewSession.InterviewType.valueOf(req.getInterviewType().toUpperCase()));
        session.setResumeText(req.getResumeText());
        session.setStatus(InterviewSession.SessionStatus.ACTIVE);
        session.setStartedAt(LocalDateTime.now());
        return sessionRepo.save(session);
    }

    public InterviewSession getSession(Long id) {
        return sessionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found: " + id));
    }

    public List<InterviewSession> getUserSessions(Long userId) {
        return sessionRepo.findByUserIdOrderByStartedAtDesc(userId);
    }

    @Transactional
    public InterviewQA saveQA(Long sessionId, SaveQARequest req) {
        InterviewQA qa = new InterviewQA();
        qa.setSessionId(sessionId);
        qa.setQuestion(req.getQuestion());
        qa.setAnswerText(req.getAnswerText());
        qa.setAnswerAudioPath(req.getAnswerAudioPath());
        qa.setFollowUpOf(req.getFollowUpOf());
        qa.setAiScore(req.getAiScore());
        qa.setAiFeedback(req.getAiFeedback());
        qa.setEmotionSnapshot(req.getEmotionSnapshot());
        qa.setTimestamp(LocalDateTime.now());
        return qaRepo.save(qa);
    }

    public List<InterviewQA> getSessionQA(Long sessionId) {
        return qaRepo.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    @Transactional
    public Map<String, Object> endSession(Long sessionId, Map<String, Object> analysisData) {
        InterviewSession session = getSession(sessionId);
        session.setStatus(InterviewSession.SessionStatus.COMPLETED);
        session.setEndedAt(LocalDateTime.now());
        sessionRepo.save(session);

        SessionAnalysis analysis = new SessionAnalysis();
        analysis.setSessionId(sessionId);

        if (analysisData != null) {
            analysis.setConfidenceScore(toDouble(analysisData.get("confidence_score")));
            analysis.setClarityScore(toDouble(analysisData.get("clarity_score")));
            analysis.setDepthScore(toDouble(analysisData.get("depth_score")));
            analysis.setEyeContactScore(toDouble(analysisData.get("eye_contact_score")));
            analysis.setOverallScore(toDouble(analysisData.get("overall_score")));
            analysis.setAiSummary((String) analysisData.get("ai_summary"));
            Object fwc = analysisData.get("filler_word_count");
            if (fwc instanceof Number) analysis.setFillerWordCount(((Number) fwc).intValue());
        }

        analysisRepo.save(analysis);

        Map<String, Object> result = new HashMap<>();
        result.put("session", session);
        result.put("analysis", analysis);
        return result;
    }

    public SessionAnalysis getAnalysis(Long sessionId) {
        return analysisRepo.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Analysis not found for session: " + sessionId));
    }

    private Double toDouble(Object val) {
        if (val instanceof Number) return ((Number) val).doubleValue();
        return null;
    }
}
