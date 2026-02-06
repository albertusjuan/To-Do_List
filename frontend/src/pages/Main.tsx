import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TodoList } from '../components/TodoList';
import './Main.css';

export type ViewMode = 'personal' | 'team';

export function Main() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<ViewMode>('personal');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`main-container ${mode === 'team' ? 'team-mode' : 'personal-mode'}`}>
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-logo">
            <button 
              className={`mode-toggle-btn ${mode === 'team' ? 'team-active' : 'personal-active'}`}
              onClick={() => setMode(mode === 'personal' ? 'team' : 'personal')}
            >
              <div className="mode-circle"></div>
              <div className="mode-text-container">
                <span className={`mode-text ${mode === 'personal' ? 'show' : 'hide'}`}>TODO.</span>
                <span className={`mode-text team-text ${mode === 'team' ? 'show' : 'hide'}`}>TeamDO.</span>
              </div>
            </button>
          </div>
          
          <div className="nav-datetime">
            <div className="nav-date">{formatDate(currentDate)}</div>
            <div className="nav-time">{formatTime(currentDate)}</div>
          </div>

          <div className="nav-actions">
            <button onClick={handleSignOut} className="signout-button">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <TodoList userId={user?.id} mode={mode} />
      </main>
    </div>
  );
}

