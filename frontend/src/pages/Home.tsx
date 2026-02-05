import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TodoList } from '../components/TodoList';
import './Home.css';

export function Home() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-content">
          <h2>TODO.</h2>
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

