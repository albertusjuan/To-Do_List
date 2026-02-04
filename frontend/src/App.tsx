import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Check backend API connection
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.message))
      .catch(() => setApiStatus('Backend not connected'));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Sleekflow To-Do List</h1>
        <p>Welcome to your to-do list application!</p>
        <div className="status-card">
          <p><strong>Backend Status:</strong> {apiStatus}</p>
          <p><strong>Frontend:</strong> Running ✅</p>
          <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
        </div>
      </header>
    </div>
  );
}

export default App;
