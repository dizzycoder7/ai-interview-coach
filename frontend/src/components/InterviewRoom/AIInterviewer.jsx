import styles from './AIInterviewer.module.css';

export default function AIInterviewer({
  question,
  tips,
  isProcessing,
  isListening,
  questionNumber,
  reduceEffects,
}) {
  // Determine avatar state: ready, listening, thinking (NEVER "speaking" when waiting for candidate!)
  const currentState = isProcessing
    ? 'thinking'
    : isListening
    ? 'listening'
    : 'ready';

  const stateLabel = isProcessing
    ? 'Evaluating your response...'
    : isListening
    ? 'Listening to your answer...'
    : 'Panel ready • Your turn to answer';

  const subPrompt = isProcessing
    ? 'Analyzing technical depth and structure'
    : isListening
    ? 'Microphone active • Speak clearly'
    : 'Click "Speak" below or type in the box';

  return (
    <div className={styles.container}>
      {/* Top Status Bar with Quiet 3-State Avatar */}
      <div className={styles.topBar}>
        <div className={styles.stateIndicator}>
          {/* Small, Quiet Avatar Orb */}
          <div
            className={`${styles.quietOrb} ${styles[currentState]} ${reduceEffects ? styles.reduced : ''}`}
            title={`Interviewer status: ${stateLabel}`}
            role="status"
            aria-label={stateLabel}
          >
            <div className={styles.orbCore} />
            <div className={styles.orbRing} />
          </div>

          <div className={styles.stateTextGroup}>
            <span className={styles.stateLabel}>{stateLabel}</span>
            <span className={styles.stateSubPrompt}>{subPrompt}</span>
          </div>
        </div>

        <span className={styles.roundLabel}>Question {questionNumber || 1}</span>
      </div>

      {/* Main Question Presentation Area */}
      <div className={styles.questionSection}>
        {isProcessing ? (
          <div className={styles.thinkingBlock}>
            <div className={styles.thinkingSpinner} />
            <p className={styles.thinkingText}>Evaluating your response and formulating the next placement question...</p>
          </div>
        ) : (
          <h2 className={styles.questionHeading}>{question}</h2>
        )}

        {/* Guidance / Placement Hint */}
        {tips && !isProcessing && (
          <div className={styles.hintCard}>
            <div className={styles.hintHeader}>
              <span className={styles.hintIcon}>💡</span>
              <span className={styles.hintTitle}>Placement hint:</span>
              <span className={styles.hintBody}>{tips}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
