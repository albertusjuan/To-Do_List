import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TodoList } from '../components/TodoList';
import './Main.css';

// Bell Icon Component
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 6 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export type ViewMode = 'personal' | 'team';

export function Main() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<ViewMode>('personal');
  const [showNotifications, setShowNotifications] = useState(false);

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
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="notifications-button"
              title="Notifications"
            >
              <BellIcon />
            </button>
            <button onClick={handleSignOut} className="signout-button">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <TodoList userId={user?.id} mode={mode} />
      </main>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="notifications-overlay" onClick={() => setShowNotifications(false)}>
          <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notifications-header">
              <h3>Notifications</h3>
              <button 
                onClick={() => setShowNotifications(false)}
                className="notifications-close"
              >
                ×
              </button>
            </div>
            <div className="notifications-content">
              <div className="notification-item">
                <div className="notification-icon">🎯</div>
                <div className="notification-text">
                  <h4>Welcome to TODO!</h4>
                  <p>Start organizing your tasks efficiently.</p>
                  <span className="notification-time">Just now</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon">✨</div>
                <div className="notification-text">
                  <h4>New Feature</h4>
                  <p>Team collaboration is now available!</p>
                  <span className="notification-time">1 hour ago</span>
                </div>
              </div>
              <div className="notifications-empty">
                <p>You're all caught up! 🎉</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

