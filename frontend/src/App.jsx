import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import InterviewRoom from './pages/InterviewRoom';
import Scorecard from './pages/Scorecard';
import NavigationRail from './components/NavigationRail/NavigationRail';
import TabModal from './components/NavigationRail/TabModal';
import './index.css';

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'interview' | 'scorecard'
  const [sessionData, setSessionData] = useState(null);
  const [scoreData, setScoreData] = useState(null);

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

  const goHome = () => {
    setPage('landing');
    setSessionData(null);
    setScoreData(null);
    setActiveTab('new');
  };

  const handleSelectTab = (tabId) => {
    if (tabId === 'new') {
      if (page === 'scorecard') {
        goHome();
      } else if (page === 'interview') {
        if (window.confirm('Do you want to leave the active interview and start a new one?')) {
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
      {/* Desktop Left Rail & Mobile Bottom Bar (hidden during active interview for clean focus) */}
      {page !== 'interview' && (
        <NavigationRail
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          reduceEffects={reduceEffects}
          onToggleReduceEffects={toggleReduceEffects}
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
        {page === 'landing' && <LandingPage onStart={startInterview} />}
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
