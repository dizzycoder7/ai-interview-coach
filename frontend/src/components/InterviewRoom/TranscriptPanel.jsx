import { useEffect, useRef } from 'react';
import styles from './TranscriptPanel.module.css';

export default function TranscriptPanel({ transcript, onTranscriptChange, history }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, history]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>📝 Transcript</span>
        <span className={styles.count}>{history.length} answered</span>
      </div>
      <div className={styles.body}>
        {history.map((item, i) => (
          <div key={i} className={styles.historyItem}>
            <div className={styles.historyQ}>
              <span className={styles.badge}>Q{i + 1}</span>
              <span>{item.question}</span>
            </div>
            <div className={styles.historyA}>
              <span className={styles.badge} style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--accent-green)' }}>A</span>
              <span>{item.answer_text}</span>
            </div>
            {item.ai_score !== undefined && (
              <div className={styles.score}>Score: {item.ai_score}/10</div>
            )}
          </div>
        ))}

        {transcript && (
          <div className={styles.liveTranscript}>
            <span className={styles.liveDot}></span>
            <span>{transcript}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
