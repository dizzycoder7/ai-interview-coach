import { useState, useRef } from 'react';
import { sessionApi, interviewApi } from '../api/client';
import ResumeUpload from '../components/ResumeUpload/ResumeUpload';
import { getAdaptiveOpeningQuestion, recordAskedQuestionId } from '../utils/questionBank';
import heroImg from '../assets/ai_coach_light_hero.jpg';
import styles from './LandingPage.module.css';

const TARGET_COMPANIES = [
  'TCS Ninja & Digital',
  'Infosys DSE & SE',
  'Wipro Elite',
  'Cognizant GenC',
  'Accenture ASE',
  'Capgemini',
];

const INTERVIEW_TRACKS = [
  {
    id: 'TECHNICAL',
    label: 'Technical round',
    desc: 'Core Java, OOPs, DBMS, SQL, Basic Data Structures',
    iconText: '</>',
  },
  {
    id: 'BEHAVIORAL',
    label: 'HR round',
    desc: 'Self-intro, Teamwork, Relocation, Shifts, Willingness to learn',
    iconText: '💼',
  },
  {
    id: 'CODING',
    label: 'Aptitude & logic',
    desc: 'Quantitative aptitude, puzzles, and coding logic',
    iconText: '📊',
  },
  {
    id: 'MIXED',
    label: 'Combined mock',
    desc: 'Full placement simulation (Technical + Projects + HR)',
    iconText: '👥',
  },
];

const EXPERIENCE_LEVELS = [
  {
    id: 'JUNIOR',
    label: 'Fresher / Junior',
    sub: '0–1 years',
    desc: 'Core Java, OOPs, Collections, SQL & final-year project',
    iconText: '🌱',
  },
  {
    id: 'MID',
    label: '1–2 Years experience',
    sub: '1–2 years',
    desc: 'Core Java, Spring Boot, MySQL, REST APIs & problem solving',
    iconText: '🚀',
  },
  {
    id: 'ADVANCED',
    label: 'Advanced',
    sub: 'Optional',
    desc: 'In-depth algorithms, complexity & technical logic',
    iconText: '⚡',
  },
];

export default function LandingPage({ onStart, onOpenMenu }) {
  const [selectedType, setSelectedType] = useState('TECHNICAL');
  const [experienceLevel, setExperienceLevel] = useState('JUNIOR');
  const [name, setName] = useState('');
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoModal, setShowDemoModal] = useState(false);

  const setupCardRef = useRef(null);

  const scrollToSetup = () => {
    if (setupCardRef.current) {
      setupCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const nameInput = setupCardRef.current.querySelector('input');
      if (nameInput) nameInput.focus();
    }
  };

  const handleStart = async () => {
    if (!name.trim()) {
      setError('Please enter your candidate name to begin');
      scrollToSetup();
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Create session in backend (with 4s timeout fallback)
      let session;
      try {
        const sessionPromise = sessionApi.create({
          interviewType: selectedType,
          userId: null,
          resumeText: resumeData?.rawText || null,
        });
        const sessionRes = await Promise.race([
          sessionPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
        ]);
        session = sessionRes.data;
      } catch (err) {
        console.warn('Backend session fallback notice:', err);
        session = { id: Date.now(), interviewType: selectedType };
      }

      // 2. Get first question from AI engine (with 9s timeout, falls back to unrepeated question bank)
      let firstQuestion;
      try {
        const questionPromise = interviewApi.start({
          interview_type: selectedType,
          candidate_name: name,
          resume_text: resumeData?.rawText || null,
          experience_level: experienceLevel,
        });
        const questionRes = await Promise.race([
          questionPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 9000)),
        ]);
        if (questionRes?.data?.question && questionRes.data.question.length > 20) {
          firstQuestion = questionRes.data;
          recordAskedQuestionId(`ai_${questionRes.data.question.slice(0, 32).replace(/[^a-zA-Z0-9]/g, '_')}`);
        } else {
          throw new Error('Invalid AI response');
        }
      } catch (err) {
        console.warn('AI engine question fallback notice (using adaptive placement bank):', err);
        firstQuestion = getAdaptiveOpeningQuestion({
          interviewType: selectedType,
          candidateName: name,
          experienceLevel,
          resumeData,
        });
      }

      onStart({
        session,
        firstQuestion,
        interviewType: selectedType,
        candidateName: name,
        resumeData,
        experienceLevel,
      });
    } catch (e) {
      console.error('Error starting interview:', e);
      setError('Could not initialize interview room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Fullscreen Looping Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className={styles.videoBackground}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />

      {/* Main Content Layer */}
      <div className={styles.mainContent}>
        {/* Glassmorphic Navigation Bar */}
        <header className={styles.navbar}>
          <div className={styles.navContainer}>
            <div className={styles.navLeftGroup}>
              {onOpenMenu && (
                <button
                  type="button"
                  className={`liquid-glass ${styles.navHamburgerBtn}`}
                  onClick={onOpenMenu}
                  aria-label="Open navigation menu"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                  <span className={styles.navHamburgerLabel}>Menu</span>
                </button>
              )}

              <div className={styles.logo}>
                Placement Prep<sup className={styles.supRegistered}>®</sup>
              </div>
            </div>

            <nav className={styles.navLinks}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.navLinkActive}`}
                onClick={scrollToSetup}
              >
                Practice
              </button>
              <a href="#companies" className={styles.navLink}>
                Companies
              </a>
              <button
                type="button"
                className={styles.navLink}
                onClick={scrollToSetup}
              >
                Resume
              </button>
              <a href="#methodology" className={styles.navLink}>
                Methodology
              </a>
              <button
                type="button"
                className={styles.navLink}
                onClick={() => setShowDemoModal(true)}
              >
                Demo
              </button>
            </nav>

            <button
              type="button"
              className={`liquid-glass ${styles.navCta}`}
              onClick={scrollToSetup}
            >
              Begin Journey
            </button>
          </div>
        </header>

        {/* Cinematic Hero Section */}
        <section className={styles.heroSection}>
          <h1
            className={`animate-fade-rise ${styles.heroTitle}`}
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Where <em className={styles.mutedEm}>dreams</em> rise{' '}
            <em className={styles.mutedEm}>through the silence.</em>
          </h1>

          <p className={`animate-fade-rise-delay ${styles.heroSubtext}`}>
            We're designing tools for deep thinkers, bold creators, and aspiring engineers.
            Amid the chaos, we build digital spaces for sharp focus and inspired work.
          </p>

          <button
            type="button"
            className={`liquid-glass animate-fade-rise-delay-2 ${styles.heroCta}`}
            onClick={scrollToSetup}
          >
            Begin Journey
          </button>
        </section>

        {/* Target Companies Ticker Ribbon */}
        <div id="companies" className={styles.tickerSection}>
          <div className={styles.tickerGlassCard}>
            <span className={styles.tickerLabel}>TARGET CAMPUS DRIVES</span>
            <div className={styles.tickerList}>
              {TARGET_COMPANIES.map((company, i) => (
                <span key={i} className={styles.tickerBadge}>
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Placement Mock Interview Setup Card */}
        <section ref={setupCardRef} className={styles.setupSection}>
          <div className={styles.setupGlassCard}>
            <div className={styles.setupHeader}>
              <div className={styles.setupHeaderIcon}>🎯</div>
              <div>
                <h2 className={styles.setupTitle}>Configure your placement mock</h2>
                <p className={styles.setupSubtitle}>
                  Tailored specifically for Indian IT services campus recruitment (TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini).
                </p>
              </div>
            </div>

            {/* Step 1: Candidate Name */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                <span>👤</span> Candidate name
              </label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g. Rohit Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>

            {/* Step 2: Resume Upload (Optional) */}
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>
                  <span>📄</span> Resume (Optional)
                </label>
                <span className={styles.fieldHint}>PDF, DOCX (Max 5MB)</span>
              </div>
              <ResumeUpload
                onResumeParsed={(data) => setResumeData(data)}
                onResumeRemoved={() => setResumeData(null)}
              />
            </div>

            {/* Step 3: Interview Track */}
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>
                  <span>🎯</span> Select interview track
                </label>
                <span className={styles.fieldHint}>Placement focus</span>
              </div>

              <div className={styles.trackGrid}>
                {INTERVIEW_TRACKS.map((t) => {
                  const isSelected = selectedType === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`${styles.trackCard} ${isSelected ? styles.trackCardSelected : ''}`}
                      onClick={() => setSelectedType(t.id)}
                    >
                      <div className={styles.trackCardHeader}>
                        <div className={styles.trackLeftGroup}>
                          <span className={styles.trackIcon}>{t.iconText}</span>
                          <span className={styles.trackName}>{t.label}</span>
                        </div>
                        <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                          {isSelected && <span>✓</span>}
                        </div>
                      </div>
                      <p className={styles.trackDesc}>{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Experience / Target Bar */}
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>
                  <span>📶</span> Experience level
                </label>
                <span className={styles.fieldHint}>Default: Fresher</span>
              </div>

              <div className={styles.levelGrid}>
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const isSelected = experienceLevel === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      className={`${styles.levelCard} ${isSelected ? styles.levelCardSelected : ''}`}
                      onClick={() => setExperienceLevel(lvl.id)}
                    >
                      <div className={styles.levelCardHeader}>
                        <span className={styles.levelName}>{lvl.label}</span>
                        <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                          {isSelected && <span>✓</span>}
                        </div>
                      </div>
                      <span className={styles.levelSub}>{lvl.sub}</span>
                      <p className={styles.levelDesc}>{lvl.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strict Privacy Notice Banner */}
            <div className={styles.privacyBanner}>
              <span className={styles.privacyIcon}>🔒</span>
              <p className={styles.privacyText}>
                <strong>Strict Privacy Guarantee:</strong> Video and audio are recorded exclusively in your browser memory via MediaRecorder. Nothing is ever uploaded or stored on any server.
              </p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Action Button: Start Practice Interview */}
            <button
              className={styles.launchBtn}
              onClick={handleStart}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  <span>Initializing placement interview...</span>
                </>
              ) : (
                <span>Launch Placement Interview Room →</span>
              )}
            </button>
          </div>
        </section>

        {/* Structured 3-Step Walkthrough Section */}
        <section id="methodology" className={styles.walkthroughSection}>
          <div className={styles.walkthroughHeader}>
            <span className={styles.walkthroughSub}>PLACEMENT METHODOLOGY</span>
            <h2 className={styles.walkthroughTitle}>How the practice room works</h2>
          </div>

          <div className={styles.walkthroughGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNum}>1</div>
              <h3 className={styles.stepTitle}>AI campus panel questions</h3>
              <p className={styles.stepDesc}>
                The AI panel prompts you with targeted placement questions covering Core Java, OOPs, Collections, SQL, and your final-year project.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNum}>2</div>
              <h3 className={styles.stepTitle}>Live speech & delivery telemetry</h3>
              <p className={styles.stepDesc}>
                Speak your answers aloud. The platform monitors your duration, eye contact percentage, and filler words in real time to build oral confidence.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNum}>3</div>
              <h3 className={styles.stepTitle}>Recruiter scorecard & model answers</h3>
              <p className={styles.stepDesc}>
                Receive a realistic verdict: Ready (70+), Almost (50–69), or Not yet, complete with 10/10 gold-standard answers and a targeted 7-day action sprint.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Walkthrough Demo Modal */}
      {showDemoModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowDemoModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Placement Interview Walkthrough</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowDemoModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <img
                src={heroImg}
                alt="Walkthrough preview"
                className={styles.modalImg}
              />
              <div className={styles.modalSteps}>
                <p>
                  <strong>1. Speak aloud:</strong> Deliver your technical explanation clearly as you would to a campus panel.
                </p>
                <p>
                  <strong>2. Live tracking:</strong> Your video and voice are evaluated in memory for eye contact, word count, and pacing.
                </p>
                <p>
                  <strong>3. Gold standard answers:</strong> Compare your responses against exemplary 10/10 models with intuitive analogies.
                </p>
              </div>
              <button
                className={styles.modalStartBtn}
                onClick={() => {
                  setShowDemoModal(false);
                  scrollToSetup();
                }}
                type="button"
              >
                Ready? Configure your interview now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
