import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
          <h2>📝 Sleekflow To-Do</h2>
          <div className="nav-actions">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleSignOut} className="signout-button">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="welcome-section">
          <h1>🎉 Welcome to Your To-Do List!</h1>
          <p>You're successfully logged in as <strong>{user?.email}</strong></p>
          
          <div className="info-card">
            <h3>✅ Authentication Working!</h3>
            <p>Your credentials are securely stored in Supabase.</p>
            <ul>
              <li>User ID: <code>{user?.id}</code></li>
              <li>Email: <code>{user?.email}</code></li>
              <li>Authenticated: <span className="badge">Yes</span></li>
            </ul>
          </div>

          <div className="next-steps">
            <h3>🚀 Next Steps:</h3>
            <ol>
              <li>Create a database table for todos</li>
              <li>Build the todo list interface</li>
              <li>Add CRUD operations</li>
              <li>Enable real-time updates</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}

