import { useState, useMemo } from 'react';
import { WARMUP_CATEGORIES } from '../../utils/warmupQuestionBank';
import styles from './WarmupReview.module.css';

export default function WarmupReview({ reviewData, onRestart, onHome }) {
  const { track, completedQuestions = [] } = reviewData || {};

  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [activeInsight, setActiveInsight] = useState('jobTerms'); // 'jobTerms' | 'mostUsed' | 'talkingPoints'
  const [copyStatus, setCopyStatus] = useState('');

  const currentItem = completedQuestions[selectedQuestionIndex] || completedQuestions[0] || {};
  const currentQuestion = currentItem.questionObj || {};
  const currentAnalysis = currentItem.analysis || {};
  const currentCategory = WARMUP_CATEGORIES[currentQuestion.category] || WARMUP_CATEGORIES.TECHNICAL;

  // Build rendered answer with highlighted tokens based on active insight tab
  const renderedAnswer = useMemo(() => {
    const rawAnswer = currentItem.answerText || '';
    if (!rawAnswer) return <em>No answer recorded.</em>;

    if (activeInsight === 'jobTerms') {
      const terms = currentAnalysis.detectedTerms || [];
      if (terms.length === 0) return rawAnswer;

      // Create a regex matching any of the detected terms
      const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');

      const parts = rawAnswer.split(regex);
      return parts.map((part, idx) => {
        const isMatch = terms.some((t) => t.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark key={idx} className={styles.highlightJobTerm} title="Job-Related Term">
              {part}
            </mark>
          );
        }
        return part;
      });
    }

    if (activeInsight === 'mostUsed') {
      const repeatedWords = (currentAnalysis.mostUsedWords || []).map((w) => w.word);
      if (repeatedWords.length === 0) return rawAnswer;

      const escapedWords = repeatedWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');

      const parts = rawAnswer.split(regex);
      return parts.map((part, idx) => {
        const isMatch = repeatedWords.some((w) => w.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark key={idx} className={styles.highlightRepeat} title="Repeated Word">
              {part}
            </mark>
          );
        }
        return part;
      });
    }

    return rawAnswer;
  }, [currentItem, activeInsight, currentAnalysis]);

  // Copy full practice session transcript
  const handleCopyTranscript = () => {
    const lines = [
      `Google-Style Interview Warmup Practice Transcript`,
      `Track: ${track?.label || 'General'}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `--------------------------------------------------`,
      '',
    ];

    completedQuestions.forEach((item, idx) => {
      lines.push(`Question ${idx + 1} [${item.questionObj?.category || 'General'}]:`);
      lines.push(`${item.questionObj?.question || ''}`);
      lines.push('');
      lines.push(`Your Answer:`);
      lines.push(`${item.answerText || ''}`);
      lines.push('');
      if (item.analysis?.detectedTerms?.length > 0) {
        lines.push(`Job-Related Terms: ${item.analysis.detectedTerms.join(', ')}`);
      }
      lines.push('--------------------------------------------------');
      lines.push('');
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2500);
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.reviewHeader}>
        <div className={styles.titleArea}>
          <span className={styles.celebrateIcon}>🎉</span>
          <div>
            <h1 className={styles.pageTitle}>Warmup Complete! Here are your insights</h1>
            <p className={styles.pageSubtitle}>
              {track?.label || 'Software Engineering'} • 5 of 5 questions answered
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.copyAllBtn} onClick={handleCopyTranscript}>
            {copyStatus ? '✅ Copied to Clipboard' : '📋 Copy All Answers'}
          </button>

          <button className={styles.newRoundBtn} onClick={onRestart}>
            🔄 Practice Another 5
          </button>

          <button className={styles.copyAllBtn} onClick={onHome}>
            🏠 Exit
          </button>
        </div>
      </header>

      {/* 5-Question Selector Tabs */}
      <div className={styles.questionTabs}>
        {completedQuestions.map((item, idx) => {
          const isActive = idx === selectedQuestionIndex;
          const cat = WARMUP_CATEGORIES[item.questionObj?.category] || WARMUP_CATEGORIES.TECHNICAL;
          return (
            <button
              key={item.questionObj?.id || idx}
              className={`${styles.qTab} ${isActive ? styles.qTabActive : ''}`}
              onClick={() => setSelectedQuestionIndex(idx)}
            >
              <span className={styles.tabNumber}>Question {idx + 1}</span>
              <span className={styles.tabCategory} style={{ color: cat.color }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Split Review Grid */}
      <div className={styles.reviewGrid}>
        {/* Left Card: Question & Candidate Answer */}
        <div className={styles.answerCard}>
          <div className={styles.qMetaRow}>
            <span
              className={`${styles.categoryTag} ${
                styles[
                  currentCategory.id === 'BACKGROUND'
                    ? 'tagBackground'
                    : currentCategory.id === 'SITUATIONAL'
                    ? 'tagSituational'
                    : 'tagTechnical'
                ]
              }`}
            >
              {currentCategory.label} Question
            </span>

            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              {currentAnalysis.wordCount || 0} words
            </span>
          </div>

          <h2 className={styles.qHeading}>{currentQuestion.question}</h2>

          <div className={styles.answerBox}>{renderedAnswer}</div>
        </div>

        {/* Right Card: Google 3 ML Insights */}
        <div className={styles.insightsPanel}>
          <nav className={styles.insightNav}>
            <button
              className={`${styles.navTab} ${activeInsight === 'jobTerms' ? styles.navTabActive : ''}`}
              onClick={() => setActiveInsight('jobTerms')}
            >
              🏷️ Job-Related Terms
            </button>

            <button
              className={`${styles.navTab} ${activeInsight === 'mostUsed' ? styles.navTabActive : ''}`}
              onClick={() => setActiveInsight('mostUsed')}
            >
              🔁 Most-Used Words
            </button>

            <button
              className={`${styles.navTab} ${activeInsight === 'talkingPoints' ? styles.navTabActive : ''}`}
              onClick={() => setActiveInsight('talkingPoints')}
            >
              📋 Talking Points
            </button>
          </nav>

          <div className={styles.insightBody}>
            {/* Tab 1: Job-Related Terms */}
            {activeInsight === 'jobTerms' && (
              <>
                <div>
                  <h3 className={styles.sectionHeader}>Terms you used</h3>
                  {(currentAnalysis.detectedTerms || []).length > 0 ? (
                    <div className={styles.chipsContainer}>
                      {currentAnalysis.detectedTerms.map((term, i) => (
                        <span key={i} className={styles.detectedChip}>
                          ✓ {term}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      No domain-specific keywords detected yet. Try incorporating industry tools or concepts.
                    </p>
                  )}
                </div>

                <div>
                  <h3 className={styles.sectionHeader}>Related terms you could consider</h3>
                  {(currentAnalysis.suggestedTerms || []).length > 0 ? (
                    <div className={styles.chipsContainer}>
                      {currentAnalysis.suggestedTerms.map((term, i) => (
                        <span key={i} className={styles.suggestedChip}>
                          + {term}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      Great coverage! You hit all primary keywords.
                    </p>
                  )}
                </div>

                <div className={styles.coachingTipCard}>
                  <span>💡</span>
                  <p className={styles.coachingText}>
                    Using industry-standard vocabulary signals domain fluency and helps recruiters identify your hands-on technical familiarity.
                  </p>
                </div>
              </>
            )}

            {/* Tab 2: Most-Used Words */}
            {activeInsight === 'mostUsed' && (
              <>
                <div>
                  <h3 className={styles.sectionHeader}>Frequently repeated words</h3>
                  {(currentAnalysis.mostUsedWords || []).length > 0 ? (
                    <div className={styles.chipsContainer}>
                      {currentAnalysis.mostUsedWords.map((item, i) => (
                        <span key={i} className={styles.countChip}>
                          {item.word}
                          <span className={styles.countBadge}>×{item.count}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      Excellent vocabulary diversity! No repeated words detected.
                    </p>
                  )}
                </div>

                {currentAnalysis.totalFillers > 0 && (
                  <div>
                    <h3 className={styles.sectionHeader}>Filler words detected ({currentAnalysis.totalFillers})</h3>
                    <div className={styles.chipsContainer}>
                      {Object.entries(currentAnalysis.fillers || {}).map(([filler, cnt], i) => (
                        <span key={i} className={styles.countChip} style={{ borderColor: '#ea4335', color: '#ea4335' }}>
                          "{filler}"
                          <span className={styles.countBadge} style={{ background: '#ea4335' }}>
                            ×{cnt}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.coachingTipCard}>
                  <span>💡</span>
                  <p className={styles.coachingText}>
                    Pausing briefly instead of using filler words ("um", "basically", "like") gives you a moment to formulate structured thoughts and projects confidence.
                  </p>
                </div>
              </>
            )}

            {/* Tab 3: Talking Points */}
            {activeInsight === 'talkingPoints' && (
              <>
                <div>
                  <h3 className={styles.sectionHeader}>Structural talking points</h3>
                  <div className={styles.pointsList}>
                    {(currentAnalysis.talkingPoints || []).map((pt, i) => (
                      <div
                        key={i}
                        className={`${styles.pointItem} ${
                          pt.covered ? styles.pointCovered : styles.pointOmitted
                        }`}
                      >
                        <span className={styles.pointIcon}>{pt.covered ? '✅' : '○'}</span>
                        <div>
                          <strong style={{ color: pt.covered ? '#0f9d58' : 'var(--color-ink)' }}>
                            {pt.covered ? 'Covered' : 'Consider touching on'}:
                          </strong>{' '}
                          <span>{pt.point}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.coachingTipCard}>
                  <span>💡</span>
                  <p className={styles.coachingText}>
                    {currentQuestion.category === 'SITUATIONAL'
                      ? 'For situational questions, use the STAR format: Situation, Task, Action you took, and measurable Result.'
                      : currentQuestion.category === 'BACKGROUND'
                      ? 'For background questions, focus on your passion, relevant academic/work milestones, and what excites you about this role.'
                      : 'For technical questions, begin with a clear definition, explain internal mechanics, and mention practical edge cases.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
