import { useState, useEffect, useRef } from 'react';
import styles from './TranscriptPanel.module.css';

export default function TranscriptPanel({ transcript, onTranscriptChange, history = [] }) {
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className={styles.panel}>
      {/* Panel Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <span className={styles.title}>Your verbal answer</span>
          {transcript && <span className={styles.liveTag}>● Transcribing live</span>}
        </div>

        {history.length > 0 && (
          <button
            className={styles.historyToggleBtn}
            onClick={() => setShowHistory((s) => !s)}
            type="button"
          >
            {showHistory ? 'Hide' : 'View'} past answers ({history.length})
          </button>
        )}
      </div>

      {/* Main Response Area */}
      <div className={styles.body}>
        {/* Past Questions History (Collapsible so it doesn't clutter active question) */}
        {showHistory && history.length > 0 && (
          <div className={styles.historyDrawer}>
            {history.map((item, i) => (
              <div key={i} className={styles.historyItem}>
                <div className={styles.historyQ}>
                  <span className={styles.badge}>Q{i + 1}</span>
                  <span className={styles.historyText}>{item.question}</span>
                </div>
                <div className={styles.historyA}>
                  <span className={styles.badgeAnswer}>Answer:</span>
                  <span className={styles.historyText}>{item.answer_text}</span>
                </div>
                {item.ai_score !== undefined && (
                  <div className={styles.scoreBadge}>Score: {item.ai_score}/10</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Live Active Speech Transcription & Direct Edit */}
        <div className={styles.activeTranscript}>
          <textarea
            className={styles.transcriptTextarea}
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            placeholder="Click 'Speak' below and speak your answer, or type your answer directly here..."
            rows={3}
          />
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
