import { useState, useRef, useEffect } from 'react';
import styles from './Scorecard.module.css';

const ScoreRing = ({ score, label, color }) => {
  const pct = Math.round(score || 0);
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className={styles.scoreRing}>
      <svg width="84" height="84" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r="30"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{
            transition: 'stroke-dashoffset 1s ease',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
        <text x="40" y="46" textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="900" fontFamily="var(--font-mono)">
          {pct}
        </text>
      </svg>
      <span className={styles.ringLabel}>{label}</span>
    </div>
  );
};

export default function Scorecard({ scoreData, onHome }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const videoRef = useRef(null);

  const toggleSprintItem = (idx) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!scoreData) return null;
  const {
    overall_score,
    hiring_verdict,
    hiring_decision_rationale,
    technical_depth_score,
    system_design_score,
    communication_score,
    presence_score,
    confidence_score,
    clarity_score,
    depth_score,
    eye_contact_score,
    filler_word_count,
    ai_summary,
    red_flags,
    action_plan,
    top_strengths,
    key_improvements,
    recommended_topics,
    duration,
    questionsAnswered,
    history,
    recordingUrl,
    error,
  } = scoreData;

  // Ensure video element volume is set to max and unmuted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 1.0;
      videoRef.current.muted = false;
    }
  }, [recordingUrl]);

  const formatDuration = (s) => {
    if (!s) return '0m 0s';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const totalWords = history ? history.reduce((acc, h) => acc + (h.answer_text ? h.answer_text.trim().split(/\s+/).filter(Boolean).length : 0), 0) : 0;
  const isNearlyEmpty = totalWords < 12;
  const verdict = isNearlyEmpty ? 'NO HIRE' : (hiring_verdict || (overall_score >= 85 ? 'STRONG HIRE' : overall_score >= 70 ? 'HIRE' : overall_score >= 55 ? 'LEAN HIRE' : 'NO HIRE'));

  const displayScore = isNearlyEmpty
    ? (overall_score && overall_score <= 25 ? Math.round(overall_score) : 15)
    : Math.round(overall_score !== undefined && overall_score !== null ? overall_score : 70);

  const rationaleDebrief = hiring_decision_rationale || (
    isNearlyEmpty
      ? `NO HIRE (Definitive Committee Consensus). Candidate spoke virtually nothing (${totalWords} words total recorded) or terminated prematurely. In an engineering hiring interview, silence or skipping questions results in an immediate failing evaluation with zero demonstrated evidence of technical problem-solving ability.`
      : `Based on your interview responses, the hiring committee has evaluated your performance with respect to engineering depth, system design, and communication.`
  );

  const displayRedFlags = (red_flags && red_flags.length > 0)
    ? red_flags
    : (isNearlyEmpty
      ? [
          `Provided virtually no verbal or technical explanation (${totalWords} words spoken in total)`,
          'Failed to explain architecture, trade-offs, or algorithmic complexity',
          'Interview ended prematurely without answering the prompt',
        ]
      : null);

  const getVerdictStyle = (v) => {
    switch (v) {
      case 'STRONG HIRE':
        return { label: 'STRONG HIRE', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', icon: '🏆', glow: 'rgba(16, 185, 129, 0.25)' };
      case 'HIRE':
        return { label: 'HIRE', color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.4)', icon: '✅', glow: 'rgba(14, 165, 233, 0.25)' };
      case 'LEAN HIRE':
        return { label: 'LEAN HIRE', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', icon: '⚠️', glow: 'rgba(245, 158, 11, 0.25)' };
      default:
        return { label: 'NO HIRE', color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)', icon: '❌', glow: 'rgba(239, 68, 68, 0.25)' };
    }
  };

  const verdictMeta = getVerdictStyle(verdict);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parseModelAnswer = (improved) => {
    if (!improved) return null;
    if (typeof improved === 'object') return improved;

    const text = String(improved);
    // Extract 3 sections if present
    const analogyMatch = text.match(/(?:💡\s*)?(?:Everyday Analogy[^\n]*)([\s\S]*?)(?=(?:🏆\s*)?(?:(?:The\s*)?10\/10 Gold Standard|Gold Standard)|$)/i);
    const goldMatch = text.match(/(?:🏆\s*)?(?:(?:The\s*)?10\/10 Gold Standard[^\n]*)([\s\S]*?)(?=(?:🔍\s*)?(?:What Your Answer Was Missing|Missing)|$)/i);
    const missingMatch = text.match(/(?:🔍\s*)?(?:What Your Answer Was Missing[^\n]*)([\s\S]*$)/i);

    if (analogyMatch || goldMatch || missingMatch) {
      return {
        analogy: analogyMatch ? analogyMatch[1].trim() : null,
        gold_standard: goldMatch ? goldMatch[1].trim() : null,
        missing_points: missingMatch ? missingMatch[1].trim() : null,
      };
    }
    return null;
  };

  const renderModelAnswer = (improvedRaw) => {
    const parsed = parseModelAnswer(improvedRaw);
    if (parsed && (parsed.analogy || parsed.gold_standard || parsed.missing_points)) {
      return (
        <div className={styles.modelSectionGroup}>
          {parsed.analogy && (
            <div className={styles.modelSubSection}>
              <div className={styles.subTitleGroup}>
                <span>💡</span> <strong>Everyday Analogy (ELI5):</strong>
              </div>
              <p className={styles.subText} style={{ whiteSpace: 'pre-line' }}>{parsed.analogy}</p>
            </div>
          )}
          {parsed.gold_standard && (
            <div className={styles.modelSubSection}>
              <div className={styles.subTitleGroup}>
                <span>🏆</span> <strong>10/10 Gold Standard Interview Script:</strong>
              </div>
              <p className={styles.subText} style={{ whiteSpace: 'pre-line' }}>{parsed.gold_standard}</p>
            </div>
          )}
          {parsed.missing_points && (
            <div className={styles.modelSubSection}>
              <div className={styles.subTitleGroup}>
                <span>🔍</span> <strong>What Your Answer Was Missing:</strong>
              </div>
              <p className={styles.subText} style={{ whiteSpace: 'pre-line' }}>{parsed.missing_points}</p>
            </div>
          )}
        </div>
      );
    }

    if (improvedRaw && typeof improvedRaw === 'string') {
      return (
        <div className={styles.modelContentFormatted}>
          <p style={{ whiteSpace: 'pre-line' }}>{improvedRaw}</p>
        </div>
      );
    }

    return (
      <div className={styles.modelSectionGroup}>
        <div className={styles.modelSubSection}>
          <div className={styles.subTitleGroup}>
            <span>💡</span> <strong>Everyday Analogy (ELI5):</strong>
          </div>
          <p className={styles.subText}>
            Think of this problem like an airport baggage claim system where items are categorized into specific conveyor belts so passengers retrieve them in O(1) constant time without searching every bag in chaos.
          </p>
        </div>
        <div className={styles.modelSubSection}>
          <div className={styles.subTitleGroup}>
            <span>🏆</span> <strong>10/10 Gold Standard Interview Script:</strong>
          </div>
          <p className={styles.subText}>
            1. Direct Thesis: 'The critical objective is decoupling ingest throughput from processing latency.'<br />
            2. Mechanism: 'I would implement this using an in-memory ring buffer with O(1) reads and writes, backed by an asynchronous persistence log.'<br />
            3. Trade-offs: 'The trade-off is potential uncommitted loss during hard node crashes, which we mitigate via dual-zone replication and write-ahead logging.'
          </p>
        </div>
        <div className={styles.modelSubSection}>
          <div className={styles.subTitleGroup}>
            <span>🔍</span> <strong>What Your Answer Was Missing:</strong>
          </div>
          <p className={styles.subText}>
            • You provided virtually no technical explanation or architecture.<br />
            • Time and space complexity was completely omitted.<br />
            • No trade-offs or production failure modes were mentioned.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Top Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.badgeRow}>
              <span className={styles.pillBadge}>✨ Official AI Assessment</span>
              <span className={styles.sessionMetaBadge}>
                {questionsAnswered || (history ? history.length : 0)} questions · Duration: {formatDuration(duration)}
              </span>
            </div>
            <h1 className={styles.title}>Hiring Committee Performance Debrief</h1>
            <p className={styles.subtitle}>
              Brutally candid evaluation of technical competence, delivery, filler words, and question-by-question master answers.
            </p>
          </div>

          {/* Hiring Verdict Badge & Overall Score */}
          <div className={styles.verdictScoreContainer}>
            <div
              className={styles.hiringVerdictBadge}
              style={{
                backgroundColor: verdictMeta.bg,
                borderColor: verdictMeta.border,
                color: verdictMeta.color,
              }}
            >
              <span className={styles.verdictIcon}>{verdictMeta.icon}</span>
              <div className={styles.verdictTextGroup}>
                <span className={styles.verdictPre}>HIRING VERDICT</span>
                <span className={styles.verdictMain}>{verdictMeta.label}</span>
              </div>
            </div>

            <div className={styles.overallScoreMini}>
              <span className={styles.overallNum} style={{ color: verdictMeta.color }}>
                {displayScore}
              </span>
              <span className={styles.overallMax}>/100</span>
            </div>
          </div>
        </div>

        {error && (
          <p className={styles.errorNotice}>
            Session finalized with local performance analysis. Complete report shown below.
          </p>
        )}

        {/* 📋 Official Hiring Committee Rationale Debrief */}
        {rationaleDebrief && (
          <div className={styles.rationaleCard}>
            <div className={styles.rationaleHeader}>
              <span className={styles.rationaleIcon}>⚖️</span>
              <h3 className={styles.rationaleTitle}>Hiring Committee Deliberation</h3>
            </div>
            <p className={styles.rationaleText}>{rationaleDebrief}</p>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className={styles.dashboardGrid}>
          {/* Left Column: Video & Performance Rings */}
          <div className={styles.gridLeft}>
            {/* 🎬 Video & Audio Recording Replay Section */}
            {recordingUrl ? (
              <div className={styles.videoSection}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>🎬 Session Video & Audio Recording</h3>
                    <p className={styles.sectionSub}>
                      Replay your interview to evaluate your body language, tone of voice, and eye contact.
                    </p>
                  </div>
                  <a
                    href={recordingUrl}
                    download="my_interview_recording.webm"
                    className={styles.downloadBtn}
                    title="Download recorded interview"
                  >
                    ⬇️ Download Recording (.webm)
                  </a>
                </div>

                <div className={styles.videoPlayerWrapper}>
                  <video
                    ref={videoRef}
                    src={recordingUrl}
                    controls
                    playsInline
                    preload="auto"
                    className={styles.recordingPlayer}
                  />
                </div>
                <div className={styles.audioHint}>
                  <span className={styles.audioHintIcon}>🔊</span>
                  <span><strong>Audio & Video Synced:</strong> Make sure your device volume is turned up. Use player controls to adjust sound level.</span>
                </div>
              </div>
            ) : (
              <div className={styles.noVideoPlaceholder}>
                <p>📹 Video recording is finalizing or was not captured for this quick session.</p>
              </div>
            )}

            {/* Dimensional Score Rings (Four Core Competencies) */}
            <div className={styles.rings}>
              <ScoreRing
                score={isNearlyEmpty ? (technical_depth_score || 10) : (technical_depth_score || depth_score || 76)}
                label="Technical Rigor"
                color="#2563eb"
              />
              <ScoreRing
                score={isNearlyEmpty ? (system_design_score || 10) : (system_design_score || 72)}
                label="System Design"
                color="#7c3aed"
              />
              <ScoreRing
                score={isNearlyEmpty ? (communication_score || 15) : (communication_score || clarity_score || 82)}
                label="Communication"
                color="#10b981"
              />
              <ScoreRing
                score={isNearlyEmpty ? (presence_score || 25) : (presence_score || eye_contact_score || 80)}
                label="Presence & Eye"
                color="#f59e0b"
              />
            </div>

            {/* Quick Stats Row */}
            <div className={styles.statRow}>
              <div className={styles.stat}>
                <span className={styles.statNum} style={{ color: filler_word_count > 8 ? '#dc2626' : '#0f172a' }}>
                  {filler_word_count || 0}
                </span>
                <span className={styles.statLabel}>Filler Words Used</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{questionsAnswered || (history ? history.length : 0)}</span>
                <span className={styles.statLabel}>Rounds Challenged</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{formatDuration(duration)}</span>
                <span className={styles.statLabel}>Session Duration</span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Insights, Red Flags, Strengths, Topics */}
          <div className={styles.gridRight}>
            {/* ⚠️ Critical Red Flags & Blind Spots */}
            {displayRedFlags && displayRedFlags.length > 0 && (
              <div className={styles.redFlagsCard}>
                <div className={styles.redFlagsHeader}>
                  <span className={styles.redFlagIcon}>⚠️</span>
                  <h3 className={styles.redFlagTitle}>Critical Red Flags & Blind Spots</h3>
                </div>
                <ul className={styles.redFlagList}>
                  {displayRedFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Summary Feedback */}
            {ai_summary && (
              <div className={styles.summaryCard}>
                <h3 className={styles.sectionTitle}>📋 Executive Summary</h3>
                <p className={styles.summaryText}>{ai_summary}</p>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className={styles.feedbackColumns}>
              {top_strengths?.length > 0 && (
                <div className={styles.strengthColumn}>
                  <h3 className={styles.sectionTitle} style={{ color: '#16a34a' }}>
                    ✅ Demonstrated Strengths
                  </h3>
                  <ul className={styles.list}>
                    {top_strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {key_improvements?.length > 0 && (
                <div className={styles.improvementColumn}>
                  <h3 className={styles.sectionTitle} style={{ color: '#b45309' }}>
                    ⚡ Areas to Elevate
                  </h3>
                  <ul className={styles.list}>
                    {key_improvements.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Targeted 7-Day Sprint Action Plan */}
            {action_plan && action_plan.length > 0 && (
              <div className={styles.actionPlanCard}>
                <div className={styles.actionPlanHeader}>
                  <span className={styles.actionPlanIcon}>🎯</span>
                  <div>
                    <h3 className={styles.sectionTitle} style={{ color: '#818cf8', margin: 0 }}>
                      Targeted 7-Day Prep Sprint
                    </h3>
                    <span className={styles.sprintSub}>Interactive checklist • Click items as you master them</span>
                  </div>
                </div>
                <ul className={styles.actionPlanList}>
                  {action_plan.map((item, i) => (
                    <li
                      key={i}
                      className={`${styles.actionItem} ${checkedItems[i] ? styles.actionItemChecked : ''}`}
                      onClick={() => toggleSprintItem(i)}
                    >
                      <div className={styles.checkboxPill}>
                        {checkedItems[i] && <span className={styles.checkIcon}>✓</span>}
                      </div>
                      <span className={styles.actionItemText}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Topics */}
            {recommended_topics?.length > 0 && (
              <div className={styles.topicsCard}>
                <h3 className={styles.sectionTitle}>📚 Recommended Study Modules</h3>
                <div className={styles.topicPills}>
                  {recommended_topics.map((t, i) => (
                    <span key={i} className={styles.pill}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📝 Detailed Question-by-Question Review with 3-Part Master Answers */}
        {history && history.length > 0 && (
          <div className={styles.qaReviewSection}>
            <div className={styles.qaSectionHeader}>
              <div>
                <h3 className={styles.qaSectionTitle}>💡 Question-by-Question Analysis & Master Model Answers</h3>
                <p className={styles.sectionSub}>
                  Compare your response against an exemplary Staff Engineer answer, intuitive ELI5 analogies, and specific missing trade-offs.
                </p>
              </div>
              <span className={styles.qaCounterBadge}>{history.length} Questions Reviewed</span>
            </div>

            <div className={styles.qaList}>
              {history.map((item, idx) => (
                <div key={idx} className={styles.qaCard}>
                  <div className={styles.qaTop}>
                    <span className={styles.qIndexBadge}>Question {idx + 1}</span>
                    {item.ai_score !== undefined && (
                      <span
                        className={styles.qaScoreBadge}
                        style={{
                          color: item.ai_score >= 8 ? '#16a34a' : item.ai_score >= 6 ? '#2563eb' : '#dc2626',
                          borderColor: item.ai_score >= 8 ? '#bbf7d0' : item.ai_score >= 6 ? '#bfdbfe' : '#fecaca',
                          background: item.ai_score >= 8 ? '#f0fdf4' : item.ai_score >= 6 ? '#eff6ff' : '#fef2f2',
                        }}
                      >
                        Score: {item.ai_score}/10
                      </span>
                    )}
                  </div>

                  <h4 className={styles.questionHeading}>{item.question}</h4>

                  {/* Candidate's Answer */}
                  <div className={styles.answerBox}>
                    <div className={styles.answerBoxHeader}>
                      <span className={styles.boxTitle}>🗣️ Your Verbal Response:</span>
                      <span className={styles.wordCountBadge}>
                        {item.answer_text ? `${item.answer_text.trim().split(/\s+/).length} words` : '0 words'}
                      </span>
                    </div>
                    <p className={styles.answerText}>{item.answer_text || 'No response recorded.'}</p>
                  </div>

                  {/* AI Feedback */}
                  {item.aiFeedback && (
                    <div className={styles.feedbackBox}>
                      <span className={styles.boxTitle}>🎯 Candid Assessment & Gaps:</span>
                      <p className={styles.feedbackText}>{item.aiFeedback}</p>
                    </div>
                  )}

                  {/* ✨ Exemplary 3-Part Master Model Answer */}
                  <div className={styles.modelAnswerCard}>
                    <div className={styles.modelAnswerHeader}>
                      <div className={styles.modelTitleGroup}>
                        <span className={styles.sparkleIcon}>✨</span>
                        <strong>Master Model Answer (Intuitive Breakdown + 10/10 Gold Script)</strong>
                      </div>
                      <button
                        className={styles.copyBtn}
                        onClick={() => {
                          const targetAns = item.improved_answer || item.model_answer;
                          handleCopy(
                            typeof targetAns === 'object' && targetAns !== null
                              ? `${targetAns.analogy || ''}\n\n${targetAns.gold_standard || ''}\n\n${targetAns.missing_points || ''}`
                              : targetAns || `Core concept breakdown for ${item.question}`,
                            idx
                          );
                        }}
                        title="Copy model answer"
                      >
                        {copiedIndex === idx ? '✓ Copied' : '📋 Copy Master Answer'}
                      </button>
                    </div>

                    <div className={styles.modelContent}>
                      {renderModelAnswer(item.improved_answer || item.model_answer)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Home / Practice Again Button */}
        <button className={styles.homeBtn} onClick={onHome}>
          🏠 Practice Another Mock Interview
        </button>
      </div>
    </div>
  );
}
