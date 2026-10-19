import { PROBE_TYPE_META, getPersonaById } from '../../utils/questionBank';
import styles from './AIInterviewer.module.css';

export default function AIInterviewer({
  question,
  tips,
  isProcessing,
  isListening,
  questionNumber,
  reduceEffects,
  personaId = 'STRICT_CAMPUS',
  conversationalTurn = 0,
  probeType = null,
  activeListeningAnchor = null,
}) {
  const persona = getPersonaById(personaId);
  const probeMeta = probeType && PROBE_TYPE_META[probeType] ? PROBE_TYPE_META[probeType] : null;

  // Determine avatar state: ready, listening, thinking (NEVER "speaking" when waiting for candidate!)
  const currentState = isProcessing
    ? 'thinking'
    : isListening
    ? 'listening'
    : 'ready';

  const stateLabel = isProcessing
    ? `${persona.name} is evaluating...`
    : isListening
    ? 'Listening to your answer...'
    : 'Panel ready • Your turn to answer';

  const subPrompt = isProcessing
    ? 'Analyzing technical rigor, ownership & metrics'
    : isListening
    ? 'Microphone active • Speak clearly'
    : 'Click "Speak" below or type in the box';

  return (
    <div className={styles.container}>
      {/* Top Status Bar with Persona & Avatar */}
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

        {/* Right side: Persona chip + Probing Turn + Round index */}
        <div className={styles.topBarRight}>
          <span
            className={styles.personaBadge}
            title={`${persona.name} (${persona.company}): ${persona.tone}`}
            style={{ borderColor: persona.accentColor, color: persona.accentColor }}
          >
            {persona.badge}
          </span>

          {conversationalTurn > 0 ? (
            <span className={styles.turnBadge}>
              Turn probe {conversationalTurn}/2
            </span>
          ) : (
            <span className={styles.turnBadge} style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
              Core Topic
            </span>
          )}

          <span className={styles.roundLabel}>Round {questionNumber || 1}</span>
        </div>
      </div>

      {/* Main Question Presentation Area */}
      <div className={styles.questionSection}>
        {/* Active Probe Chip & Active Listening Quote */}
        {!isProcessing && (probeMeta || activeListeningAnchor) && (
          <div className={styles.probeContextBar}>
            {probeMeta && conversationalTurn > 0 && (
              <span
                className={styles.probeBadge}
                style={{
                  backgroundColor: `${probeMeta.color}15`,
                  color: probeMeta.color,
                  border: `1px solid ${probeMeta.color}35`,
                }}
                title={probeMeta.description}
              >
                <span>{probeMeta.icon}</span>
                <span>{probeMeta.label}</span>
              </span>
            )}
          </div>
        )}

        {/* Active Listening Anchor Banner */}
        {!isProcessing && activeListeningAnchor && conversationalTurn > 0 && (
          <div className={styles.listeningAnchorBox}>
            <span className={styles.listeningAnchorIcon}>👂</span>
            <div className={styles.listeningAnchorBody}>
              <span className={styles.listeningAnchorLabel}>Anchor Point from Your Last Answer:</span>
              <span className={styles.listeningAnchorQuote}>"{activeListeningAnchor}"</span>
            </div>
          </div>
        )}

        {isProcessing ? (
          <div className={styles.thinkingBlock}>
            <div className={styles.thinkingSpinner} />
            <p className={styles.thinkingText}>
              {persona.name} is assessing depth, identifying gaps, and framing the next follow-up...
            </p>
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
