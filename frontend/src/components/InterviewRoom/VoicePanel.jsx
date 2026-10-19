import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './VoicePanel.module.css';

// Deduplicate consecutive repeating words and phrases (from browser Web Speech stutters or repetitions)
function cleanDuplicatePhrases(text) {
  if (!text) return '';
  let cleaned = text.replace(/\s+/g, ' ').trim();

  // 1. Remove consecutive identical single words: "in in" -> "in", "the the" -> "the"
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // 2. Remove consecutive identical multi-word phrases (lengths 2 to 8 words)
  for (let n = 8; n >= 2; n--) {
    const words = cleaned.split(' ');
    let changed = false;
    const newWords = [];
    let i = 0;
    while (i < words.length) {
      if (i + 2 * n <= words.length) {
        const p1 = words.slice(i, i + n).join(' ').toLowerCase();
        const p2 = words.slice(i + n, i + 2 * n).join(' ').toLowerCase();
        if (p1 === p2) {
          newWords.push(...words.slice(i, i + n));
          i += 2 * n;
          changed = true;
          continue;
        }
      }
      newWords.push(words[i]);
      i++;
    }
    if (changed) {
      cleaned = newWords.join(' ');
    }
  }

  return cleaned;
}

export default function VoicePanel({
  isListening,
  isProcessing,
  onListeningChange,
  onTranscriptUpdate,
  onAnswerSubmit,
  transcript = '',
  questionIndex = 0,
}) {
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const isProcessingRef = useRef(isProcessing);
  isProcessingRef.current = isProcessing;

  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  // Base text already typed or committed before the current speech recognition session started
  const baseTextRef = useRef('');

  const [supported, setSupported] = useState(false);
  const [micError, setMicError] = useState('');
  const [bars, setBars] = useState(Array(20).fill(3));

  const animFrameRef = useRef(null);
  const analyzerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const visualizerStreamRef = useRef(null);

  const stopVisualizer = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    if (visualizerStreamRef.current) {
      visualizerStreamRef.current.getTracks().forEach((t) => t.stop());
      visualizerStreamRef.current = null;
    }
    setBars(Array(20).fill(3));
  }, []);

  // When questionIndex changes (new question arrived):
  // Immediately abort active speech recognition, flush baseTextRef, and stop visualizer.
  useEffect(() => {
    try {
      recognitionRef.current?.abort();
    } catch (_) {}
    baseTextRef.current = '';
    onListeningChange(false);
    stopVisualizer();
  }, [questionIndex, stopVisualizer, onListeningChange]);

  // When transcript is cleared externally (e.g., on question advance), reset baseTextRef
  useEffect(() => {
    if (!transcript) {
      baseTextRef.current = '';
    }
  }, [transcript]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const chunk = res[0]?.transcript || '';
          if (res.isFinal) {
            sessionFinal += (sessionFinal ? ' ' : '') + chunk.trim();
          } else {
            sessionInterim += (sessionInterim ? ' ' : '') + chunk.trim();
          }
        }

        // Combine base prefix + final session phrases + interim phrase
        const parts = [baseTextRef.current, sessionFinal, sessionInterim].filter(Boolean);
        const combined = parts.join(' ').replace(/\s+/g, ' ');
        const sanitized = cleanDuplicatePhrases(combined);

        onTranscriptUpdate(sanitized);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e.error);
        if (e.error === 'no-speech') {
          // Normal brief silence between words - keep listening!
          return;
        }
        if (e.error === 'aborted') {
          return;
        }
        if (e.error === 'not-allowed') {
          setMicError('Microphone permission blocked. Please click the camera/lock icon in your browser URL bar and set Microphone to "Allow".');
          onListeningChange(false);
          stopVisualizer();
          return;
        }
        if (e.error === 'network') {
          setMicError('Speech recognition network glitch. You can also type your answer directly in the box above.');
        }
      };

      recognition.onend = () => {
        // In Chrome, SpeechRecognition can stop after pauses. Auto-restart only if candidate is still speaking and not processing
        if (isListeningRef.current && !isProcessingRef.current) {
          // Commit whatever was accumulated so far so the next restarted session appends cleanly
          baseTextRef.current = transcriptRef.current ? transcriptRef.current.trim() : '';
          try {
            recognition.start();
          } catch (_) {
            setTimeout(() => {
              if (isListeningRef.current && !isProcessingRef.current) {
                try {
                  recognition.start();
                } catch (retryErr) {
                  console.warn('SpeechRecognition restart notice:', retryErr);
                }
              }
            }, 250);
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSupported(false);
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
    };
  }, [onListeningChange, onTranscriptUpdate]);

  const startVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      visualizerStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;
      const analyzer = ctx.createAnalyser();
      analyzerRef.current = analyzer;
      analyzer.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyzer);

      const dataArr = new Uint8Array(analyzer.frequencyBinCount);
      const animate = () => {
        analyzer.getByteFrequencyData(dataArr);
        const newBars = Array.from({ length: 20 }, (_, i) => {
          const val = dataArr[Math.floor((i * dataArr.length) / 20)] || 0;
          return Math.max(3, (val / 255) * 32);
        });
        setBars(newBars);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch (e) {
      console.warn('Voice visualizer stream notice:', e);
      // Fallback pseudo-bars so user sees activity when speaking
      const pseudoInterval = setInterval(() => {
        if (!isListeningRef.current) {
          clearInterval(pseudoInterval);
          return;
        }
        setBars(Array.from({ length: 20 }, () => Math.floor(Math.random() * 20 + 4)));
      }, 100);
    }
  }, []);


  const toggleListening = useCallback(() => {
    if (isProcessing) return;
    setMicError('');

    if (!isListening) {
      // Snapshot any existing text in the box as base prefix
      baseTextRef.current = transcriptRef.current ? transcriptRef.current.trim() : '';

      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('SpeechRecognition start notice:', err);
      }
      onListeningChange(true);
      startVisualizer();
    } else {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      baseTextRef.current = '';
      onListeningChange(false);
      stopVisualizer();
    }
  }, [isListening, isProcessing, onListeningChange, startVisualizer, stopVisualizer]);

  const handleSubmit = useCallback(() => {
    const finalAnswer = (transcript || transcriptRef.current || '').trim();
    if (!finalAnswer || isProcessing) return;

    isListeningRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch (_) {}
    onListeningChange(false);
    stopVisualizer();

    baseTextRef.current = '';
    onAnswerSubmit(finalAnswer);
  }, [isListening, isProcessing, onAnswerSubmit, onListeningChange, stopVisualizer, transcript]);

  const hasContent = Boolean((transcript || transcriptRef.current || '').trim());

  return (
    <div className={styles.wrapper}>
      {micError && (
        <div className={styles.micErrorBanner}>
          <span>⚠️ {micError}</span>
        </div>
      )}

      <div className={styles.panel}>
        {/* Audio Visualizer Waves */}
        <div className={styles.visualizer} title={isListening ? 'Microphone listening' : 'Audio idle'}>
          {bars.map((h, i) => (
            <div
              key={i}
              className={`${styles.bar} ${isListening ? styles.barActive : ''}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className={styles.controls}>
          <button
            className={`${styles.micBtn} ${isListening ? styles.micActive : ''}`}
            onClick={toggleListening}
            disabled={isProcessing}
            type="button"
            title={isListening ? 'Stop recording microphone' : 'Start speaking your answer'}
          >
            {isListening ? (
              <>
                <span className={styles.recordingPulse} />
                <span>⏹ Stop mic</span>
              </>
            ) : (
              <>
                <span>🎙️ Speak</span>
              </>
            )}
          </button>

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isProcessing || !hasContent}
            type="button"
            title={hasContent ? 'Submit answer for evaluation' : 'Speak or type an answer to submit'}
          >
            {isProcessing ? (
              <>
                <span className={styles.spinner} />
                <span>Evaluating...</span>
              </>
            ) : (
              <span>Submit Answer →</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
