import { useState, useRef } from 'react';
import { sessionApi, interviewApi } from '../api/client';
import ResumeUpload from '../components/ResumeUpload/ResumeUpload';
import heroImg from '../assets/ai_coach_light_hero.jpg';
import styles from './LandingPage.module.css';

const INTERVIEW_TRACKS = [
  {
    id: 'TECHNICAL',
    label: 'Technical',
    desc: 'DSA, System Design, Coding, Core CS',
    iconText: '</>',
    badgeClass: styles.badgePurple,
  },
  {
    id: 'BEHAVIORAL',
    label: 'Behavioral',
    desc: 'Leadership, Teamwork, Situations (STAR)',
    iconText: '💼',
    badgeClass: styles.badgeRose,
  },
  {
    id: 'CODING',
    label: 'Aptitude',
    desc: 'Quantitative, Logic, Problem Solving',
    iconText: '📊',
    badgeClass: styles.badgeTeal,
  },
  {
    id: 'MIXED',
    label: 'Domain Specific',
    desc: 'AI/ML, Web Development, Data Science, etc.',
    iconText: '👥',
    badgeClass: styles.badgeIndigo,
  },
];

const EXPERIENCE_LEVELS = [
  {
    id: 'JUNIOR',
    label: 'Fresher / Junior',
    sub: '0–2 years',
    desc: 'Core Java, OOPs, Collections, Spring Boot, MySQL & Resume Projects',
    iconText: '🌱',
    badgeClass: styles.badgeTeal,
  },
  {
    id: 'MID',
    label: 'Mid-Level',
    sub: '2–5 years',
    desc: 'Concurrency, REST APIs, Hibernate/JPA, Query Optimization & Architecture',
    iconText: '🚀',
    badgeClass: styles.badgePurple,
  },
  {
    id: 'SENIOR',
    label: 'Senior / Lead',
    sub: '5+ years',
    desc: 'System Design, Scalability, High Availability & Production Trade-offs',
    iconText: '👑',
    badgeClass: styles.badgeRose,
  },
];

export default function LandingPage({ onStart }) {
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
      if (setupCardRef.current) {
        setupCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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

      // 2. Get first question from AI engine (with 5s timeout fallback)
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
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        firstQuestion = questionRes.data;
      } catch (err) {
        console.warn('AI engine question fallback notice:', err);
        const resumeHighlight = resumeData?.extractedSkills?.length
          ? `I noticed your background in ${resumeData.extractedSkills.slice(0, 3).join(', ')}. `
          : '';

        let fallbackQ = `Welcome ${name}! ${resumeHighlight}To start, could you explain the 4 pillars of Object-Oriented Programming (OOP) and how you use them in Java?`;
        if (experienceLevel === 'JUNIOR') {
          if (selectedType === 'TECHNICAL') {
            fallbackQ = `Welcome ${name}! ${resumeHighlight}To start, could you explain the 4 core pillars of OOP (Encapsulation, Inheritance, Polymorphism, Abstraction) and give a practical code example of Method Overloading vs Overriding?`;
          } else if (selectedType === 'CODING') {
            fallbackQ = `Hello ${name}! Welcome to the coding interview. In Java, how does a HashMap work internally under the hood (hashing, buckets, and collision resolution)?`;
          } else if (selectedType === 'MIXED') {
            fallbackQ = `Welcome ${name}! ${resumeHighlight}In Spring Boot and MySQL development, can you explain the roles of @RestController, @Service, and @Repository, and how Dependency Injection works?`;
          } else {
            fallbackQ = `Hi ${name}! ${resumeHighlight}Walk me through a key software project mentioned in your resume or coursework. What technologies did you use, and what was the most challenging bug you resolved?`;
          }
        } else {
          fallbackQ =
            selectedType === 'TECHNICAL'
              ? `Welcome ${name}! ${resumeHighlight}To start, could you explain the difference between a process and a thread, and how memory is shared between them?`
              : selectedType === 'BEHAVIORAL'
              ? `Hi ${name}! ${resumeHighlight}Tell me about a challenging technical project you worked on recently and how you resolved the hardest obstacle.`
              : selectedType === 'CODING'
              ? `Hello ${name}! Welcome to the coding interview. Today's challenge: How would you design an efficient algorithm to find two numbers in an array that add up to a target sum?`
              : `Welcome ${name}! ${resumeHighlight}Could you introduce yourself and walk me through your recent engineering experience?`;
        }

        firstQuestion = {
          question: fallbackQ,
          tips: 'Take your time, structure your answer clearly, and speak through your thought process with concrete examples.',
        };
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
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Top Navigation Bar */}
        <header className={styles.topNav}>
          <div className={styles.navLeft}>
            <div className={styles.brandGroup}>
              <div className={styles.robotLogoBadge}>🤖</div>
              <span className={styles.brandTitle}>AI Interviewer</span>
              <span className={styles.versionBadge}>v2.5</span>
            </div>
          </div>

          <nav className={styles.navCenter}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#how-it-works" className={styles.navLink}>How It Works</a>
            <a href="#interview-tracks" className={styles.navLink}>Interview Tracks</a>
            <a href="#pricing" className={styles.navLink}>Pricing</a>
            <a href="#testimonials" className={styles.navLink}>Testimonials</a>
            <a href="#faq" className={styles.navLink}>FAQ</a>
          </nav>

          <div className={styles.navRight}>
            <button className={styles.themeToggleBtn} title="Light Theme Active">
              ☀️
            </button>
            <button className={styles.signInBtn} onClick={scrollToSetup}>
              Sign In
            </button>
            <button className={styles.getStartedBtn} onClick={scrollToSetup}>
              Get Started →
            </button>
          </div>
        </header>

        {/* Main Hero & Setup Section (2-Column Layout matching reference) */}
        <main className={styles.mainGrid}>
          {/* Left Column: Hero Copy, Stats & Office Visual */}
          <section className={styles.heroLeft}>
            {/* Pill Badge */}
            <div className={styles.pillBadge}>
              <span className={styles.pillIcon}>⚡</span> NEXT-GEN AI INTERVIEW PREP
            </div>

            {/* Headline */}
            <h1 className={styles.heroTitle}>
              Your Personal<br />
              <span className={styles.titleGradient}>AI Interview Coach</span>
            </h1>

            {/* Subtitle */}
            <p className={styles.heroSubtitle}>
              Practice realistic interview conversations, get instant feedback, and improve with AI-powered analysis. Build confidence and crack your next interview.
            </p>

            {/* 4 Social Proof / Metrics Badges */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={`${styles.statIconBadge} ${styles.bgPurpleLight}`}>
                  👥
                </div>
                <div>
                  <span className={styles.statNum}>10K+</span>
                  <span className={styles.statLabel}>Students Trained</span>
                </div>
              </div>

              <div className={styles.statItem}>
                <div className={`${styles.statIconBadge} ${styles.bgTealLight}`}>
                  📈
                </div>
                <div>
                  <span className={styles.statNum}>95%</span>
                  <span className={styles.statLabel}>Report Improvement</span>
                </div>
              </div>

              <div className={styles.statItem}>
                <div className={`${styles.statIconBadge} ${styles.bgAmberLight}`}>
                  ⭐
                </div>
                <div>
                  <span className={styles.statNum}>4.9/5</span>
                  <span className={styles.statLabel}>User Satisfaction</span>
                </div>
              </div>

              <div className={styles.statItem}>
                <div className={`${styles.statIconBadge} ${styles.bgRoseLight}`}>
                  🎯
                </div>
                <div>
                  <span className={styles.statNum}>Real-time</span>
                  <span className={styles.statLabel}>AI Feedback</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className={styles.ctaRow}>
              <button className={styles.primaryCtaBtn} onClick={scrollToSetup}>
                Start Free Mock Interview →
              </button>
              <button
                className={styles.secondaryCtaBtn}
                onClick={() => setShowDemoModal(true)}
              >
                <span className={styles.playIconCircle}>▶</span>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className={styles.trustRow}>
              <div className={styles.trustItem}>
                <span className={styles.checkIcon}>✔</span> No credit card required
              </div>
              <div className={styles.trustItem}>
                <span className={styles.checkIcon}>✔</span> Instant feedback
              </div>
              <div className={styles.trustItem}>
                <span className={styles.checkIcon}>✔</span> Works on any device
              </div>
            </div>

            {/* Hero Visual Banner (Bottom Left) */}
            <div className={styles.heroVisualCard}>
              <img
                src={heroImg}
                alt="AI Interview Coach live mock session in modern office"
                className={styles.heroImage}
              />
            </div>
          </section>

          {/* Right Column: Setup Card */}
          <section className={styles.heroRight}>
            <div ref={setupCardRef} className={styles.setupCard}>
              {/* Corner decorative wave */}
              <div className={styles.cornerGradientDecoration}></div>

              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.targetIconCircle}>🎯</div>
                <div>
                  <h2 className={styles.cardTitle}>Start Your Mock Session</h2>
                  <p className={styles.cardSubtitle}>
                    Configure your profile to get personalized questions and real-time feedback from our AI interviewer.
                  </p>
                </div>
              </div>

              {/* Field 1: Candidate Name */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <span>👤</span> Candidate Name
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. Rohit Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  />
                </div>
              </div>

              {/* Field 2: Resume Upload (Optional) */}
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>
                    <span>📄</span> Resume (Optional)
                  </label>
                  <span className={styles.fileTypesHint}>PDF, DOCX (Max 5MB)</span>
                </div>
                <ResumeUpload
                  onResumeParsed={(data) => setResumeData(data)}
                  onResumeRemoved={() => setResumeData(null)}
                />
              </div>

              {/* Field 3: Experience & Difficulty Level */}
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>
                    <span>📶</span> Experience & Difficulty Level
                  </label>
                  <span className={styles.chooseHint}>Select your target bar</span>
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
                          <div className={styles.levelLeftGroup}>
                            <div className={`${styles.levelIconBadge} ${lvl.badgeClass}`}>
                              {lvl.iconText}
                            </div>
                            <div>
                              <div className={styles.levelName}>{lvl.label}</div>
                              <div className={styles.levelSub}>{lvl.sub}</div>
                            </div>
                          </div>

                          <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                            {isSelected && <span className={styles.checkMark}>✓</span>}
                          </div>
                        </div>

                        <p className={styles.levelDesc}>{lvl.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Field 4: Select Interview Track (2x2 Grid) */}
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>
                    <span>🎯</span> Select Interview Track
                  </label>
                  <span className={styles.chooseHint}>Choose what you want to practice</span>
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
                            <div className={`${styles.trackIconBadge} ${t.badgeClass}`}>
                              {t.iconText}
                            </div>
                            <span className={styles.trackName}>{t.label}</span>
                          </div>

                          <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                            {isSelected && <span className={styles.checkMark}>✓</span>}
                          </div>
                        </div>

                        <p className={styles.trackDesc}>{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              {/* Action Button: Start Mock Interview */}
              <button
                className={styles.startMockBtn}
                onClick={handleStart}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    <span>Initializing Mock Interview...</span>
                  </>
                ) : (
                  <>
                    <span className={styles.playTriangle}>▶</span>
                    <span>Start Mock Interview →</span>
                  </>
                )}
              </button>

              {/* Footer Trust Icons */}
              <div className={styles.cardFooterSecurity}>
                <div className={styles.securityItem}>
                  <span>🔒</span> Your data is secure
                </div>
                <span className={styles.securityDivider}>|</span>
                <div className={styles.securityItem}>
                  <span>👁️</span> Never shared with third parties
                </div>
                <span className={styles.securityDivider}>|</span>
                <div className={styles.securityItem}>
                  <span>🛡️</span> Used only for this session
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Demo Modal (Watch Demo) */}
      {showDemoModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowDemoModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>🎬 How the AI Interview Coach Works</h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowDemoModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <img
                src={heroImg}
                alt="Interview Demo"
                style={{ width: '100%', borderRadius: '12px', display: 'block' }}
              />
              <div style={{ marginTop: '1rem', lineHeight: '1.6', color: '#475569' }}>
                <p>
                  <strong>1. Speak Naturally:</strong> The AI prompts you with technical, behavioral, or domain-specific questions based on your resume.
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  <strong>2. Live Multimodal Tracking:</strong> Your video and voice are analyzed in real time for eye contact, emotion, clarity, and filler words.
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  <strong>3. Full Replay & Model Answers:</strong> At the end, replay your entire interview with audio and study crystal-clear model solutions with everyday analogies.
                </p>
              </div>
              <button
                className={styles.modalStartBtn}
                onClick={() => {
                  setShowDemoModal(false);
                  scrollToSetup();
                }}
              >
                Ready? Start Your Mock Interview Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
