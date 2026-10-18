import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import InterviewRoom from './pages/InterviewRoom';
import Scorecard from './pages/Scorecard';
import './index.css';

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'interview' | 'scorecard'
  const [sessionData, setSessionData] = useState(null);
  const [scoreData, setScoreData] = useState(null);

  const startInterview = (data) => {
    setSessionData(data);
    setPage('interview');
  };

  const finishInterview = (scores) => {
    setScoreData(scores);
    setPage('scorecard');
  };

  const goHome = () => {
    setPage('landing');
    setSessionData(null);
    setScoreData(null);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {page === 'landing' && <LandingPage onStart={startInterview} />}
      {page === 'interview' && <InterviewRoom sessionData={sessionData} onFinish={finishInterview} />}
      {page === 'scorecard' && <Scorecard scoreData={scoreData} onHome={goHome} />}
    </div>
  );
}
