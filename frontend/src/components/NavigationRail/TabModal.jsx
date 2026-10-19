import { useEffect } from 'react';
import styles from './TabModal.module.css';

export default function TabModal({
  tab,
  onClose,
  theme,
  onToggleTheme,
  reduceEffects,
  onToggleReduceEffects,
  onStartNew,
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!tab || tab === 'new') return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <span className={styles.modalIcon}>
              {tab === 'analysis' && '📊'}
              {tab === 'history' && '🕒'}
              {tab === 'resume' && '📄'}
              {tab === 'settings' && '⚙️'}
            </span>
            <h2 className={styles.modalTitle}>
              {tab === 'analysis' && 'Placement performance analysis'}
              {tab === 'history' && 'Past mock interviews'}
              {tab === 'resume' && 'Resume and target company profile'}
              {tab === 'settings' && 'Settings and privacy'}
            </h2>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className={styles.modalBody}>
          {/* TAB 1: ANALYSIS */}
          {tab === 'analysis' && (
            <>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Campus placement readiness</h3>
                <p className={styles.sectionText}>
                  Evaluation tailored for Indian IT services drives (TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini).
                </p>
              </div>

              <div className={styles.statGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>Ready (78)</span>
                  <span className={styles.statLabel}>Latest readiness bar</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>12</span>
                  <span className={styles.statLabel}>Questions practiced</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>2.1</span>
                  <span className={styles.statLabel}>Avg filler words / min</span>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Topic mastery tracker</h3>
                <div className={styles.topicList}>
                  <div className={styles.topicRow}>
                    <span>Core Java & OOPs fundamentals</span>
                    <span className={styles.topicBadgeGood}>Mastered (8.5/10)</span>
                  </div>
                  <div className={styles.topicRow}>
                    <span>DBMS & SQL queries</span>
                    <span className={styles.topicBadgeGood}>Mastered (8.0/10)</span>
                  </div>
                  <div className={styles.topicRow}>
                    <span>Collections & HashMap internals</span>
                    <span className={styles.topicBadgePractice}>Needs practice (5.8/10)</span>
                  </div>
                  <div className={styles.topicRow}>
                    <span>Final-year project explanation</span>
                    <span className={styles.topicBadgePractice}>Needs practice (6.2/10)</span>
                  </div>
                  <div className={styles.topicRow}>
                    <span>HR round: Relocation & shifts</span>
                    <span className={styles.topicBadgeGood}>Mastered (9.0/10)</span>
                  </div>
                </div>
              </div>

              <button
                className={styles.primaryBtn}
                onClick={() => {
                  onClose();
                  onStartNew?.();
                }}
              >
                Start targeted practice session →
              </button>
            </>
          )}

          {/* TAB 2: HISTORY */}
          {tab === 'history' && (
            <>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Recorded mock sessions</h3>
                <p className={styles.sectionText}>
                  Review your score, verdict, and speech pacing from previous campus placement interviews.
                </p>
              </div>

              <div className={styles.historyList}>
                <div className={styles.historyCard}>
                  <div className={styles.historyMain}>
                    <span className={styles.historyTitle}>Technical mock (Java, OOPs, DBMS)</span>
                    <span className={styles.historyMeta}>Fresher level · 6 questions · 4m 12s</span>
                  </div>
                  <span className={styles.historyScore}>Ready (78/100)</span>
                </div>

                <div className={styles.historyCard}>
                  <div className={styles.historyMain}>
                    <span className={styles.historyTitle}>HR round (Self-intro, Teamwork, Shifts)</span>
                    <span className={styles.historyMeta}>Fresher level · 5 questions · 3m 45s</span>
                  </div>
                  <span className={styles.historyScore}>Ready (84/100)</span>
                </div>

                <div className={styles.historyCard}>
                  <div className={styles.historyMain}>
                    <span className={styles.historyTitle}>Aptitude & logic mock</span>
                    <span className={styles.historyMeta}>Fresher level · 4 questions · 2m 50s</span>
                  </div>
                  <span className={styles.historyScore} style={{ color: 'var(--color-warning)' }}>
                    Almost (62/100)
                  </span>
                </div>
              </div>

              <button
                className={styles.primaryBtn}
                onClick={() => {
                  onClose();
                  onStartNew?.();
                }}
              >
                Start another mock interview →
              </button>
            </>
          )}

          {/* TAB 3: RESUME */}
          {tab === 'resume' && (
            <>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Target company profile</h3>
                <p className={styles.sectionText}>
                  Our interview AI automatically analyzes your resume to extract skills, coursework, and your final-year engineering project for realistic panel questions.
                </p>
              </div>

              <div className={styles.topicList}>
                <div className={styles.topicRow}>
                  <span>Target roles</span>
                  <span className={styles.topicBadgeGood}>TCS, Infosys, Wipro, Cognizant, Accenture</span>
                </div>
                <div className={styles.topicRow}>
                  <span>Key technical skills</span>
                  <span className={styles.topicBadgeGood}>Java, OOPs, MySQL, Spring Boot, DSA basics</span>
                </div>
                <div className={styles.topicRow}>
                  <span>Supported file formats</span>
                  <span>PDF, DOCX (Up to 5MB)</span>
                </div>
              </div>

              <div className={styles.privacyCard}>
                <div className={styles.privacyHeader}>
                  <span>💡</span> Placement tip
                </div>
                <p className={styles.privacyText}>
                  Keep your resume under one page. Clearly highlight your final-year project title, architecture, database design, and your exact personal contribution.
                </p>
              </div>

              <button
                className={styles.primaryBtn}
                onClick={() => {
                  onClose();
                  onStartNew?.();
                }}
              >
                Upload resume & start interview →
              </button>
            </>
          )}

          {/* TAB 4: SETTINGS */}
          {tab === 'settings' && (
            <>
              {/* Strict Privacy Guarantee Banner */}
              <div className={styles.privacyCard}>
                <div className={styles.privacyHeader}>
                  <span>🔒</span> Privacy guarantee (Strict)
                </div>
                <p className={styles.privacyText}>
                  Webcam video and microphone audio are <strong>never</strong> uploaded or stored on any server or database. They are recorded exclusively in your browser memory with MediaRecorder, kept only for the active session, and offered to you as a local download. Only text answers and numerical scores are saved.
                </p>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Appearance & performance</h3>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingLabelGroup}>
                  <span className={styles.settingTitle}>Color theme</span>
                  <span className={styles.settingSubtitle}>Switch between calm cool grey and dark mode</span>
                </div>
                <button
                  className={styles.toggleBtn}
                  onClick={onToggleTheme}
                >
                  {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
                </button>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingLabelGroup}>
                  <span className={styles.settingTitle}>Reduce effects</span>
                  <span className={styles.settingSubtitle}>Disables heavy animations and simplifies 3D orb avatar</span>
                </div>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={reduceEffects}
                  onChange={onToggleReduceEffects}
                />
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingLabelGroup}>
                  <span className={styles.settingTitle}>Camera & microphone</span>
                  <span className={styles.settingSubtitle}>In-browser MediaRecorder ready</span>
                </div>
                <span className={styles.topicBadgeGood}>Device active</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
