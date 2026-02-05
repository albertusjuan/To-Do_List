import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TodoList } from '../components/TodoList';
import './Home.css';

export function Home() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

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
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-content">
          <h2>TODO.</h2>
          
          <div className="nav-datetime">
            <div className="nav-date">{formatDate(currentDate)}</div>
            <div className="nav-time">{formatTime(currentDate)}</div>
          </div>

          <div className="nav-actions">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleSignOut} className="signout-button">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <TodoList userId={user?.id} />
      </main>
    </div>
  );
}

