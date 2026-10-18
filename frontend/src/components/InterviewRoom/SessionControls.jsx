import styles from './SessionControls.module.css';

export default function SessionControls({ isListening, isProcessing, sessionStatus, onEndSession }) {
  const isEnding = sessionStatus === 'ending';
  return (
    <footer className={styles.footer}>
      <div className={styles.hints}>
        <span className={styles.hint}>🎙️ Press <kbd>Speak</kbd> to record your answer</span>
        <span className={styles.hint}>✅ Press <kbd>Submit Answer</kbd> to move to next question</span>
      </div>
      <button
        className={styles.endBtn}
        onClick={onEndSession}
        disabled={isEnding || isProcessing}
      >
        {isEnding ? (
          <><span className={styles.spinner}></span> Generating report...</>
        ) : (
          '🏁 End Interview & Get Report'
        )}
      </button>
    </footer>
  );
}
