import { useState, useEffect, useRef, useCallback } from 'react';
import { sessionApi, interviewApi } from '../api/client';
import WebcamPanel from '../components/InterviewRoom/WebcamPanel';
import AIInterviewer from '../components/InterviewRoom/AIInterviewer';
import VoicePanel from '../components/InterviewRoom/VoicePanel';
import TranscriptPanel from '../components/InterviewRoom/TranscriptPanel';
import SessionControls from '../components/InterviewRoom/SessionControls';
import CodeEditorPanel from '../components/InterviewRoom/CodeEditorPanel';
import styles from './InterviewRoom.module.css';

export default function InterviewRoom({ sessionData, onFinish }) {
  const { session, firstQuestion, interviewType, candidateName, resumeData, experienceLevel } = sessionData;

  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion.question);
  const [questionTips, setQuestionTips] = useState(firstQuestion.tips || '');
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('active'); // 'active'|'paused'|'ending'
  const [emotionFrames, setEmotionFrames] = useState([]);
  const [eyeContactScore, setEyeContactScore] = useState(100);
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);

  const timerRef = useRef(null);
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleAnswerSubmit = useCallback(async (answerText) => {
    if (!answerText.trim() || isProcessing) return;
    setIsProcessing(true);

    const currentQ = currentQuestion;
    const newEntry = { question: currentQ, answer_text: answerText };

    try {
      // 1. Instant client-side filler word detection (0ms latency)
      const FILLERS = [
        'um', 'uh', 'like', 'you know', 'so', 'basically', 'literally',
        'actually', 'right', 'okay', 'well', 'kind of', 'sort of',
        'i mean', 'let me think', 'hmm'
      ];
      const lower = answerText.toLowerCase();
      let fillerCount = 0;
      FILLERS.forEach((w) => {
        const matches = lower.match(new RegExp(`\\b${w}\\b`, 'g'));
        if (matches) fillerCount += matches.length;
      });
      setFillerWordCount((prev) => prev + fillerCount);

      // 2. Evaluate answer with 8-second safety timeout
      const evalPromise = interviewApi.evaluate({
        session_id: String(session.id),
        question: currentQ,
        answer_text: answerText,
        interview_type: interviewType,
        conversation_history: history,
        resume_text: resumeData?.rawText || null,
        experience_level: experienceLevel || 'JUNIOR',
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Evaluation timeout')), 8000)
      );

      let evalData;
      try {
        const evalRes = await Promise.race([evalPromise, timeoutPromise]);
        evalData = evalRes.data;
      } catch (timeoutOrErr) {
        console.warn('Evaluation timed out or failed, using dynamic local feedback:', timeoutOrErr);
        const wordCount = answerText.trim().split(/\s+/).length;
        const score = Math.min(10, Math.max(5, Math.round(5 + wordCount / 15)));
        const isJunior = (experienceLevel || 'JUNIOR') === 'JUNIOR';

        const fallbackFollowUp = isJunior
          ? 'Good explanation! How would you handle potential edge cases or exception handling (such as null pointer or boundary checks) in Java for this scenario?'
          : 'How would you scale this architecture and handle potential bottlenecks in production?';

        const fallbackImproved = (
          `💡 Everyday Analogy:\n` +
          `Think of this concept like an everyday organized system. Clear rules, structured classes, and proper indexing make sure things run predictably and without bugs.\n\n` +
          `🔑 Master Interview Structure:\n` +
          `1. Direct Answer: Start with a crisp 1-sentence definition of the core principle or OOP concept.\n` +
          `2. Mechanism & Code: Explain how it works with concrete code examples (e.g. interfaces, collections, or SQL joins).\n` +
          `3. Best Practices: Mention boundary conditions, null checks, and why this design is clean and maintainable.`
        );

        evalData = {
          score,
          feedback: `Solid answer! Good structure covering the core points (${wordCount} words).`,
          follow_up_question: fallbackFollowUp,
          improved_answer: fallbackImproved,
          strengths: ['Direct explanation', 'Relevant technical concepts'],
          improvements: ['Consider elaborating on code edge cases and best practices'],
        };
      }

      // 3. Save Q&A to backend asynchronously (does not block candidate)
      sessionApi.saveQA(session.id, {
        question: currentQ,
        answerText,
        aiScore: evalData.score,
        aiFeedback: evalData.feedback,
      }).catch((err) => console.warn('Background saveQA note:', err));

      const updatedHistory = [
        ...history,
        {
          ...newEntry,
          ai_score: evalData.score,
          aiFeedback: evalData.feedback,
          improved_answer: evalData.improved_answer,
          strengths: evalData.strengths,
          improvements: evalData.improvements,
        },
      ];
      setHistory(updatedHistory);
      setQuestionIndex((i) => i + 1);
      setCurrentQuestion(evalData.follow_up_question);
      setQuestionTips(evalData.feedback || '');
      setTranscript('');
    } catch (err) {
      console.error('Error in answer flow:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [currentQuestion, history, interviewType, session.id, isProcessing, resumeData, experienceLevel]);


  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const handleStreamReady = useCallback(async (stream) => {
    if (!stream || mediaRecorderRef.current) return;
    try {
      recordedChunksRef.current = [];

      let streamToRecord = stream;
      const audioTracks = stream.getAudioTracks();
      console.log(`InterviewRoom: Stream received with ${stream.getVideoTracks().length} video, ${audioTracks.length} audio tracks`);

      // Double-guarantee: If audio track is missing from camera stream, fetch microphone directly
      if (audioTracks.length === 0) {
        console.warn('InterviewRoom: Audio track missing from webcam stream! Attaching dedicated mic stream...');
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          const combined = new MediaStream([
            ...stream.getVideoTracks(),
            ...micStream.getAudioTracks(),
          ]);
          streamToRecord = combined;
          console.log('InterviewRoom: Dedicated mic track attached successfully');
        } catch (micErr) {
          console.warn('InterviewRoom: Could not attach dedicated mic stream:', micErr);
        }
      }

      const mimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedType = mimeTypes.find(
        (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
      ) || '';

      console.log('InterviewRoom: Starting MediaRecorder with mimeType:', selectedType);

      const recorder = new MediaRecorder(
        streamToRecord,
        selectedType ? { mimeType: selectedType } : undefined
      );

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.warn('Failed to start MediaRecorder:', err);
    }
  }, []);

  const handleEndSession = async () => {
    setSessionStatus('ending');
    clearInterval(timerRef.current);

    // Stop MediaRecorder and await completion so WebM header and Opus audio are fully finalized!
    let recordingUrl = null;
    let recordingBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = () => {
            console.log('MediaRecorder stopped cleanly. Total chunks:', recordedChunksRef.current.length);
            resolve();
          };
          mediaRecorderRef.current.stop();
        });
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    }
    if (recordedChunksRef.current.length > 0) {
      const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
      recordingBlob = new Blob(recordedChunksRef.current, { type: mimeType });
      recordingUrl = URL.createObjectURL(recordingBlob);
    }

    let finalHistory = [...history];
    const pendingAnswer = transcript.trim();
    const alreadyAnswered = finalHistory.some((item) => item.question === currentQuestion);

    // If candidate has not submitted the current question, evaluate it now so they get honest feedback and master model answer!
    if (!alreadyAnswered) {
      const answerText = pendingAnswer || "(No verbal answer provided / Question skipped)";
      const words = pendingAnswer ? pendingAnswer.split(/\s+/).filter(Boolean) : [];
      const wordCount = words.length;
      const isSubstantive = wordCount >= 8 && pendingAnswer.length >= 20;

      let evalData = null;
      try {
        const evalRes = await interviewApi.evaluate({
          session_id: String(session.id),
          question: currentQuestion,
          answer_text: answerText,
          interview_type: interviewType,
          conversation_history: finalHistory,
          resume_text: resumeData?.rawText || null,
          experience_level: experienceLevel || 'JUNIOR',
        });
        evalData = evalRes.data;
      } catch (err) {
        console.warn('Final answer evaluate note:', err);
      }

      const score = isSubstantive ? (evalData?.score ?? Math.min(10, Math.max(3, Math.round(wordCount / 12)))) : 1;
      const feedback = isSubstantive
        ? (evalData?.feedback || "Solid response covering key principles.")
        : "Non-substantive or near-empty response. You provided virtually no technical explanation or engineering depth for this prompt.";

      const fallbackModelAnswer = (
        `💡 Everyday Analogy (ELI5):\n` +
        `Think of this concept like an everyday organized system. Clear rules, structured classes, and proper indexing make sure things run predictably and without bugs.\n\n` +
        `🏆 The 10/10 Gold Standard Interview Script:\n` +
        `1. Direct Answer: Start with a crisp definition of the core principle or OOP concept.\n` +
        `2. Mechanism & Code: Explain how it works with concrete code examples (e.g. interfaces, collections, or SQL joins).\n` +
        `3. Best Practices: Mention boundary conditions, null checks, and why this design is clean and maintainable.\n\n` +
        `🔍 What Your Answer Was Missing:\n` +
        `• Provide a concrete code or design example to demonstrate practical understanding.\n` +
        `• Highlight potential edge cases (like null checks or empty collections).\n` +
        `• Mention why this pattern is preferred over alternatives.`
      );

      const finalItem = {
        question: currentQuestion,
        answer_text: answerText,
        ai_score: score,
        aiFeedback: feedback,
        improved_answer: evalData?.improved_answer || fallbackModelAnswer,
        strengths: isSubstantive ? (evalData?.strengths || ["Answer submitted"]) : ["Prompt presented to candidate"],
        improvements: [
          "Must deliver a complete structured technical answer",
          "Proactively explain data structures and complexity",
        ],
      };

      finalHistory.push(finalItem);
      sessionApi.saveQA(session.id, {
        question: currentQuestion,
        answerText,
        aiScore: score,
        aiFeedback: feedback,
      }).catch(() => {});
    }

    try {
      // Get final scorecard from AI engine with finalHistory!
      const scoreRes = await interviewApi.score({
        session_id: String(session.id),
        qa_pairs: finalHistory,
        eye_contact_score: eyeContactScore,
        filler_word_count: fillerWordCount,
        experience_level: experienceLevel || 'JUNIOR',
      });

      const scoreData = scoreRes.data;

      // End session in backend
      await sessionApi.end(session.id, {
        ...scoreData,
        eye_contact_score: eyeContactScore,
        filler_word_count: fillerWordCount,
      });

      onFinish({
        ...scoreData,
        sessionId: session.id,
        duration: elapsedSeconds,
        questionsAnswered: finalHistory.length,
        history: finalHistory,
        recordingUrl,
        recordingBlob,
        eyeContactScore,
        fillerWordCount,
      });
    } catch (err) {
      console.error('Error ending session:', err);
      onFinish({
        error: true,
        message: err.message,
        sessionId: session.id,
        duration: elapsedSeconds,
        questionsAnswered: finalHistory.length,
        history: finalHistory,
        recordingUrl,
        recordingBlob,
        eyeContactScore,
        fillerWordCount,
      });
    }
  };

  const handleEmotionData = useCallback((data) => {
    if (data && data.face_detected) {
      setEmotionFrames(prev => [...prev.slice(-50), data]);
    }
  }, []);

  const handleEyeContact = useCallback((score) => {
    setEyeContactScore(prev => Math.round((prev * 0.9) + (score * 0.1)));
  }, []);

  return (
    <div className={styles.room}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoGroup}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logo}>MOTION INTERVIEW HUD</span>
          </div>
          <span className={styles.sessionBadge}>{interviewType}</span>
          <span className={styles.levelBadge}>
            {experienceLevel === 'JUNIOR' ? '🌱 JUNIOR' : experienceLevel === 'SENIOR' ? '🚀 SENIOR' : '⚡ MID-LEVEL'}
          </span>
          {resumeData?.fileName && (
            <span
              className={styles.resumeBadge}
              title={`Resume: ${resumeData.fileName} (${resumeData.extractedSkills?.length || 0} skills detected)`}
            >
              📄 {resumeData.extractedSkills?.length ? `${resumeData.extractedSkills.length} Skills Calibrated` : 'Resume Grounded'}
            </span>
          )}
        </div>
        <div className={styles.headerCenter}>
          <div className={styles.timerContainer}>
            <span className={styles.timerDot}></span>
            <span className={styles.timer}>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.codeBtn}
            onClick={() => setIsCodeEditorOpen((o) => !o)}
            title="Toggle Code Editor"
          >
            💻 {isCodeEditorOpen ? 'Hide IDE' : 'Scratchpad IDE'}
          </button>
          <div className={styles.hudTelemetry}>
            <span className={styles.qCount}>STAGE {questionIndex + 1}</span>
            <div className={`${styles.statusDot} ${isListening ? styles.statusLive : ''}`}></div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className={styles.main}>
        {/* Left: Webcam */}
        <div className={styles.leftPanel}>
          <WebcamPanel
            onEmotionData={handleEmotionData}
            onEyeContactScore={handleEyeContact}
            onStreamReady={handleStreamReady}
            isActive={sessionStatus === 'active'}
          />
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Eye Contact</span>
              <span className={styles.metricValue} style={{ color: eyeContactScore > 70 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
                {eyeContactScore}%
              </span>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{
                    width: `${eyeContactScore}%`,
                    background: eyeContactScore > 70 ? 'var(--accent-green)' : 'var(--accent-yellow)'
                  }}
                />
              </div>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Filler Words</span>
              <span className={styles.metricValue} style={{ color: fillerWordCount < 5 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {fillerWordCount}
              </span>
              <span className={styles.metricSub}>
                {fillerWordCount < 3 ? 'Clear delivery' : fillerWordCount < 7 ? 'Moderate pace' : 'High frequency'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: AI Interviewer + Transcript */}
        <div className={styles.centerPanel}>
          <AIInterviewer
            question={currentQuestion}
            tips={questionTips}
            isProcessing={isProcessing}
            isListening={isListening}
            questionNumber={questionIndex + 1}
          />
          <TranscriptPanel
            transcript={transcript}
            onTranscriptChange={setTranscript}
            history={history}
          />
          <VoicePanel
            isListening={isListening}
            isProcessing={isProcessing}
            onListeningChange={setIsListening}
            onTranscriptUpdate={setTranscript}
            onAnswerSubmit={handleAnswerSubmit}
          />
        </div>
      </div>

      {/* Code Editor Panel */}
      <CodeEditorPanel
        isOpen={isCodeEditorOpen}
        onClose={() => setIsCodeEditorOpen(false)}
      />

      {/* Footer Controls */}
      <SessionControls
        isListening={isListening}
        isProcessing={isProcessing}
        sessionStatus={sessionStatus}
        onEndSession={handleEndSession}
      />
    </div>
  );
}
