import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import InterviewRoom from './pages/InterviewRoom';
import Scorecard from './pages/Scorecard';
import WarmupPracticeRoom from './components/Warmup/WarmupPracticeRoom';
import WarmupReview from './components/Warmup/WarmupReview';
import NavigationRail from './components/NavigationRail/NavigationRail';
import TabModal from './components/NavigationRail/TabModal';
import './index.css';

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'interview' | 'scorecard' | 'warmup-practice' | 'warmup-review'
  const [sessionData, setSessionData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [warmupSession, setWarmupSession] = useState(null);
  const [warmupReviewData, setWarmupReviewData] = useState(null);

  // Active navigation tab ('new' | 'analysis' | 'history' | 'resume' | 'settings')
  const [activeTab, setActiveTab] = useState('new');

  // Theme Management (Light by default, persistent)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('prep_theme') || 'light';
  });

  // Reduce Effects Accessibility Toggle
  const [reduceEffects, setReduceEffects] = useState(() => {
    return localStorage.getItem('prep_reduce_effects') === 'true';
  });

  // Mobile/Drawer Navigation Open State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prep_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (reduceEffects) {
      document.documentElement.classList.add('reduced-effects');
    } else {
      document.documentElement.classList.remove('reduced-effects');
    }
    localStorage.setItem('prep_reduce_effects', String(reduceEffects));
  }, [reduceEffects]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleReduceEffects = () => {
    setReduceEffects((prev) => !prev);
  };

  const startInterview = (data) => {
    setSessionData(data);
    setPage('interview');
    setActiveTab('new');
  };

  const finishInterview = (scores) => {
    setScoreData(scores);
    setPage('scorecard');
    setActiveTab('new');
  };

  const startWarmup = ({ track, customQuestions = null }) => {
    setWarmupSession({ track, customQuestions });
    setPage('warmup-practice');
    setActiveTab('new');
  };

  const finishWarmup = (data) => {
    setWarmupReviewData(data);
    setPage('warmup-review');
    setActiveTab('new');
  };

  const restartWarmup = () => {
    setWarmupReviewData(null);
    setPage('warmup-practice');
  };

  const goHome = () => {
    setPage('landing');
    setSessionData(null);
    setScoreData(null);
    setWarmupSession(null);
    setWarmupReviewData(null);
    setActiveTab('new');
  };

  const handleSelectTab = (tabId) => {
    if (tabId === 'new') {
      if (page === 'scorecard' || page === 'warmup-review') {
        goHome();
      } else if (page === 'interview' || page === 'warmup-practice') {
        if (window.confirm('Do you want to leave the active practice session?')) {
          goHome();
        }
      }
      setActiveTab('new');
    } else {
      setActiveTab(tabId);
    }
  };


  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Desktop Left Rail & Mobile Bottom Bar (hidden during active interview & active warmup for clean focus) */}
      {page !== 'interview' && page !== 'warmup-practice' && (
        <NavigationRail
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          reduceEffects={reduceEffects}
          onToggleReduceEffects={toggleReduceEffects}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          showFloatingButton={page !== 'landing'}
        />
      )}

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {page === 'landing' && (
          <LandingPage
            onStart={startInterview}
            onStartWarmup={startWarmup}
            onOpenMenu={() => setIsMenuOpen(true)}
          />
        )}
        {page === 'interview' && (
          <InterviewRoom
            sessionData={sessionData}
            onFinish={finishInterview}
            onExit={goHome}
            theme={theme}
            onToggleTheme={toggleTheme}
            reduceEffects={reduceEffects}
            onToggleReduceEffects={toggleReduceEffects}
          />
        )}
        {page === 'scorecard' && <Scorecard scoreData={scoreData} onHome={goHome} />}
        {page === 'warmup-practice' && (
          <WarmupPracticeRoom
            track={warmupSession?.track}
            customQuestions={warmupSession?.customQuestions}
            onComplete={finishWarmup}
            onExit={goHome}
          />
        )}
        {page === 'warmup-review' && (
          <WarmupReview
            reviewData={warmupReviewData}
            onRestart={restartWarmup}
            onHome={goHome}
          />
        )}
      </main>

      {/* Modal for Navigation Rail Tabs (Analysis, History, Resume, Settings) */}
      {activeTab !== 'new' && (
        <TabModal
          tab={activeTab}
          onClose={() => setActiveTab('new')}
          theme={theme}
          onToggleTheme={toggleTheme}
          reduceEffects={reduceEffects}
          onToggleReduceEffects={toggleReduceEffects}
          onStartNew={goHome}
        />
      )}
    </div>
  );
}
