import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './VoicePanel.module.css';

export default function VoicePanel({ isListening, isProcessing, onListeningChange, onTranscriptUpdate, onAnswerSubmit }) {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [bars, setBars] = useState(Array(20).fill(3));
  const animFrameRef = useRef(null);
  const analyzerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const visualizerStreamRef = useRef(null);
  const accumulatedRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        let finalText = accumulatedRef.current;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += t + ' ';
          } else {
            interim = t;
          }
        }
        accumulatedRef.current = finalText;
        onTranscriptUpdate(finalText + interim);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        onListeningChange(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      visualizerStreamRef.current = stream;
      const ctx = new AudioContext();
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
          return Math.max(3, (val / 255) * 40);
        });
        setBars(newBars);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch (e) {
      console.warn('Voice visualizer audio error:', e);
    }
  }, []);

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

  const toggleListening = useCallback(() => {
    if (isProcessing) return;
    if (!isListening) {
      accumulatedRef.current = '';
      onTranscriptUpdate('');
      recognitionRef.current?.start();
      onListeningChange(true);
      startVisualizer();
    } else {
      recognitionRef.current?.stop();
      onListeningChange(false);
      stopVisualizer();
    }
  }, [isListening, isProcessing, onListeningChange, onTranscriptUpdate, startVisualizer, stopVisualizer]);

  const handleSubmit = useCallback(() => {
    const text = accumulatedRef.current.trim();
    if (!text) return;
    if (isListening) {
      recognitionRef.current?.stop();
      onListeningChange(false);
      stopVisualizer();
    }
    onAnswerSubmit(text);
    accumulatedRef.current = '';
  }, [isListening, onAnswerSubmit, onListeningChange, stopVisualizer]);

  if (!supported) {
    return (
      <div className={styles.unsupported}>
        ⚠️ Speech recognition not supported in this browser. Use Chrome.
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.visualizer}>
        {bars.map((h, i) => (
          <div
            key={i}
            className={`${styles.bar} ${isListening ? styles.barActive : ''}`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.micBtn} ${isListening ? styles.micActive : ''}`}
          onClick={toggleListening}
          disabled={isProcessing}
          title={isListening ? 'Stop recording' : 'Start recording'}
        >
          {isListening ? '⏹ Stop' : '🎙️ Speak'}
        </button>

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={isProcessing || !accumulatedRef.current}
        >
          {isProcessing ? (
            <><span className={styles.spinner}></span> Evaluating...</>
          ) : (
            'Submit Answer →'
          )}
        </button>
      </div>
    </div>
  );
}
