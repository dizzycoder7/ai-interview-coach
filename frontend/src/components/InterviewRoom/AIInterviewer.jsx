import { useMemo } from 'react';
import styles from './AIInterviewer.module.css';

export default function AIInterviewer({ question, tips, isProcessing, isListening, questionNumber }) {
  // Determine avatar state
  const stateClass = isProcessing
    ? styles.stateProcessing
    : isListening
    ? styles.stateListening
    : styles.stateSpeaking;

  const stateLabel = isProcessing
    ? 'Synthesizing Neural Evaluation...'
    : isListening
    ? 'Listening to Candidate Response'
    : 'Presenting Technical Challenge';

  const waveBars = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);

  return (
    <div className={styles.cockpit}>
      {/* Top HUD Telemetry */}
      <div className={styles.hudBar}>
        <div className={styles.engineTag}>
          <span className={`${styles.statusDot} ${stateClass}`}></span>
          <span className={styles.engineName}>MOTION NEURAL ENGINE</span>
          <span className={styles.versionPill}>v4.2</span>
        </div>

        <div className={styles.hudRight}>
          <span className={styles.statePill}>{stateLabel}</span>
          <span className={styles.roundBadge}>ROUND #{String(questionNumber || 1).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Main Avatar & Question Area */}
      <div className={styles.contentArea}>
        {/* 3D Quantum Bioluminescent Orb */}
        <div className={styles.orbStage}>
          <div className={`${styles.orbContainer} ${stateClass}`}>
            <div className={styles.orbHalo}></div>
            <div className={styles.orbitalRingOne}></div>
            <div className={styles.orbitalRingTwo}></div>
            <div className={styles.orbCore}>
              <div className={styles.orbInnerGlow}></div>
              <div className={styles.orbCoreShine}></div>
            </div>
          </div>

          {/* Audio Waveform Oscillations */}
          <div className={styles.waveformContainer}>
            {waveBars.map((i) => (
              <div
                key={i}
                className={`${styles.waveBar} ${stateClass}`}
                style={{
                  animationDelay: `${(i * 0.08) % 1.2}s`,
                  height: isProcessing ? '4px' : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Question Body */}
        <div className={styles.questionContainer}>
          {isProcessing ? (
            <div className={styles.processingBlock}>
              <div className={styles.processingHeader}>
                <div className={styles.synthLoader}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className={styles.processingTitle}>Formulating Next Adaptive Prompt...</span>
              </div>
              <div className={styles.processingTrack}>
                <div className={styles.processingBar}></div>
              </div>
              <p className={styles.processingSub}>
                Calibrating difficulty against resume telemetry & candidate speech depth
              </p>
            </div>
          ) : (
            <div className={styles.activeQuestionBlock}>
              <div className={styles.questionLabelRow}>
                <span className={styles.questionPromptTag}>INTERVIEW PROMPT</span>
              </div>
              <h2 className={styles.questionText}>{question}</h2>
            </div>
          )}

          {/* Pro Tips / Guidance Callout */}
          {tips && !isProcessing && (
            <div className={styles.tipsCard}>
              <div className={styles.tipsIconWrapper}>
                <span className={styles.tipsIcon}>💡</span>
              </div>
              <div className={styles.tipsContent}>
                <span className={styles.tipsTitle}>EVALUATION HINT</span>
                <p className={styles.tipsText}>{tips}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
