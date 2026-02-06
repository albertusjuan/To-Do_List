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
            <div className="mode-toggle-container">
              <div className="mode-toggle-bg">
                <div className={`mode-toggle-slider ${mode === 'team' ? 'slide-right' : 'slide-left'}`}></div>
              </div>
              <div className="mode-toggle-buttons">
                <button 
                  className={`mode-toggle-btn ${mode === 'personal' ? 'active' : ''}`}
                  onClick={() => setMode('personal')}
                >
                  TODO.
                </button>
                <button 
                  className={`mode-toggle-btn ${mode === 'team' ? 'active' : ''}`}
                  onClick={() => setMode('team')}
                >
                  TeamDO.
                </button>
              </div>
            </div>
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

