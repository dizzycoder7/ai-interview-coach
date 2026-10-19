import { useState, useEffect, useRef, useCallback } from 'react';
import {
  WARMUP_CATEGORIES,
  generateWarmupSession,
  analyzeAnswerLocally,
} from '../../utils/warmupQuestionBank';
import styles from './WarmupPracticeRoom.module.css';

export default function WarmupPracticeRoom({
  track,
  customQuestions = null,
  onComplete,
  onExit,
}) {
  const [questions, setQuestions] = useState(() => {
    if (customQuestions && customQuestions.length > 0) {
      return customQuestions.slice(0, 5);
    }
    return generateWarmupSession(track?.id || 'SOFTWARE_ENGINEERING');
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answersList, setAnswersList] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  const recognitionRef = useRef(null);
  const currentAnswerRef = useRef(currentAnswer);
  currentAnswerRef.current = currentAnswer;

  const currentQuestion = questions[currentIndex] || questions[0];
  const categoryInfo = WARMUP_CATEGORIES[currentQuestion?.category] || WARMUP_CATEGORIES.TECHNICAL;

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let baseText = '';

      recognition.onstart = () => {
        setIsListening(true);
        baseText = currentAnswerRef.current ? currentAnswerRef.current.trim() + ' ' : '';
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        const combined = (baseText + finalTranscript + interimTranscript).replace(/\s+/g, ' ');
        setCurrentAnswer(combined);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition warning:', err.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch (_) {}
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Stop listening & cancel TTS whenever question changes
  useEffect(() => {
    try {
      recognitionRef.current?.abort();
    } catch (_) {}
    setIsListening(false);
    window.speechSynthesis?.cancel();
    setIsSpeakingTTS(false);

    // If an answer was previously saved for this question, load it
    const existing = answersList[currentIndex];
    setCurrentAnswer(existing ? existing.answerText : '');
  }, [currentIndex]);

  // Toggle Microphone
  const toggleListening = () => {
    if (!recognitionSupported) {
      alert('Speech recognition is not supported in this browser. You can type your answers directly.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      try {
        window.speechSynthesis?.cancel();
        setIsSpeakingTTS(false);
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  // Text to Speech playback for current question
  const toggleTTS = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeakingTTS) {
      window.speechSynthesis.cancel();
      setIsSpeakingTTS(false);
      return;
    }

    // Stop mic while interviewer is speaking
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    }

    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => setIsSpeakingTTS(true);
    utterance.onend = () => setIsSpeakingTTS(false);
    utterance.onerror = () => setIsSpeakingTTS(false);

    window.speechSynthesis.speak(utterance);
  };

  // Redo / Clear Answer
  const handleRedo = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    }
    setCurrentAnswer('');
  };

  // Advance to Next Question or Finish Warmup
  const handleSaveAndAdvance = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    }
    window.speechSynthesis?.cancel();
    setIsSpeakingTTS(false);

    const answerText = currentAnswer.trim() || '(No response recorded / Question skipped)';
    const localAnalysis = analyzeAnswerLocally(answerText, currentQuestion);

    const updatedAnswers = [...answersList];
    updatedAnswers[currentIndex] = {
      questionObj: currentQuestion,
      answerText,
      analysis: localAnalysis,
      timestamp: new Date().toISOString(),
    };
    setAnswersList(updatedAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed all 5 questions! Send to review
      onComplete({
        track,
        completedQuestions: updatedAnswers,
        totalQuestions: questions.length,
      });
    }
  };

  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className={styles.container}>
      {/* Top Header Bar */}
      <header className={styles.headerBar}>
        <div className={styles.trackInfo}>
          <span className={styles.trackIcon}>{track?.icon || '🎙️'}</span>
          <div>
            <h1 className={styles.trackTitle}>{track?.label || 'Google Interview Warmup'}</h1>
            <p className={styles.trackSub}>5-Question Low-Pressure Practice • Real-Time Insights</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.exitBtn}
            onClick={() => {
              if (window.confirm('Do you want to exit this warmup session?')) {
                window.speechSynthesis?.cancel();
                onExit();
              }
            }}
          >
            Exit Warmup
          </button>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className={styles.stepperContainer}>
        <span className={styles.stepperLabel}>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className={styles.stepDots}>
          {questions.map((q, idx) => {
            const isCompleted = idx < currentIndex || (answersList[idx] && answersList[idx].answerText);
            const isActive = idx === currentIndex;
            return (
              <div
                key={q.id || idx}
                className={`${styles.stepDot} ${isActive ? styles.stepDotActive : ''} ${
                  isCompleted ? styles.stepDotCompleted : ''
                }`}
                title={`Question ${idx + 1}: ${q.category}`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      <div className={styles.questionCard}>
        <div className={styles.badgeRow}>
          <span className={`${styles.categoryPill} ${styles[categoryInfo.badgeClass]}`}>
            {categoryInfo.label} Question
          </span>

          <button
            className={`${styles.ttsBtn} ${isSpeakingTTS ? styles.ttsBtnActive : ''}`}
            onClick={toggleTTS}
            title={isSpeakingTTS ? 'Stop audio' : 'Listen to question'}
          >
            {isSpeakingTTS ? '⏹️ Stop Audio' : '🔊 Listen to Question'}
          </button>
        </div>

        <h2 className={styles.questionHeading}>{currentQuestion.question}</h2>

        {/* Tip Callout */}
        {currentQuestion.tips && (
          <div className={styles.tipCallout}>
            <span className={styles.tipIcon}>💡</span>
            <p className={styles.tipText}>
              <strong>Warmup Tip:</strong> {currentQuestion.tips}
            </p>
          </div>
        )}
      </div>

      {/* Candidate Response Section */}
      <div className={styles.responseSection}>
        <div className={styles.responseHeader}>
          <span className={styles.responseTitle}>
            Your Answer
            {isListening && (
              <span className={styles.statusIndicator}>
                <span className={styles.listeningDot} /> Listening...
              </span>
            )}
          </span>

          <span className={styles.metaRow}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>

        <textarea
          className={styles.answerInput}
          placeholder="Speak into your microphone or type your response here. Click 'Redo' at any time to start fresh..."
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
        />

        {/* Control Bar */}
        <div className={styles.controlBar}>
          <div className={styles.leftControls}>
            <button
              className={`${styles.micButton} ${isListening ? styles.micActive : ''}`}
              onClick={toggleListening}
            >
              {isListening ? '🛑 Stop Speaking' : '🎙️ Answer with Voice'}
            </button>

            {currentAnswer.trim() && (
              <button className={styles.redoButton} onClick={handleRedo} title="Clear and re-record this answer">
                🔄 Redo Answer
              </button>
            )}
          </div>

          <div className={styles.rightControls}>
            <button className={styles.skipButton} onClick={handleSaveAndAdvance}>
              Skip
            </button>

            <button className={styles.nextButton} onClick={handleSaveAndAdvance}>
              {isLastQuestion ? 'Review All Answers 🎉' : 'Next Question ➡️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
