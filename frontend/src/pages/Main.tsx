import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TodoList } from '../components/TodoList';
import { Todo } from '../types/database.types';
import { api } from '../utils/api';
import './Main.css';

// Bell Icon Component
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 6 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

// Clock Icon for deadline notifications
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

// Alert Icon for critical notifications
const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

// Calendar Icon for info notifications
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

// Users Icon for team invitations
const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export type ViewMode = 'personal' | 'team';

export function Main() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<ViewMode>('personal');
  const [showNotifications, setShowNotifications] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Fetch todos for notifications
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const result = await api.get<Todo[]>('/api/todos');
        if (result.success && result.data) {
          setTodos(result.data);
        }
      } catch (error) {
        console.error('Error fetching todos for notifications:', error);
      }
    };

    fetchTodos();
    // Refresh every minute
    const interval = setInterval(fetchTodos, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch team invitations
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const result = await api.get<any[]>('/api/invitations');
        if (result.success && result.data) {
          setTeamInvitations(result.data);
        }
      } catch (error) {
        console.error('Error fetching team invitations:', error);
      }
    };

    fetchInvitations();
    // Refresh every minute
    const interval = setInterval(fetchInvitations, 60000);
    return () => clearInterval(interval);
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

  // Get todos that are due soon (within 1 day or 30 minutes)
  const getDueSoonTodos = () => {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    return todos.filter(todo => {
      if (todo.status === 'COMPLETED') return false;
      
      const dueDate = new Date(todo.due_date);
      return dueDate >= now && dueDate <= oneDayFromNow;
    }).map(todo => {
      const dueDate = new Date(todo.due_date);
      const now = new Date();
      const minutesUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60));
      const hoursUntilDue = Math.floor(minutesUntilDue / 60);
      
      let timeText = '';
      let urgency: 'critical' | 'warning' | 'info' = 'info';
      
      if (minutesUntilDue < 30) {
        timeText = `Due in ${minutesUntilDue} minutes`;
        urgency = 'critical';
      } else if (hoursUntilDue < 1) {
        timeText = `Due in ${minutesUntilDue} minutes`;
        urgency = 'warning';
      } else if (hoursUntilDue < 24) {
        timeText = `Due in ${hoursUntilDue} hour${hoursUntilDue > 1 ? 's' : ''}`;
        urgency = 'warning';
      } else {
        const daysUntilDue = Math.floor(hoursUntilDue / 24);
        timeText = `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`;
        urgency = 'info';
      }
      
      return { ...todo, timeText, urgency };
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const dueSoonTodos = getDueSoonTodos();
  const notificationCount = teamInvitations.length + dueSoonTodos.length;

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const result = await api.post(`/api/invitations/${invitationId}/accept`, {});
      if (result.success) {
        alert('Invitation accepted!');
        // Remove from list
        setTeamInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const result = await api.post(`/api/invitations/${invitationId}/decline`, {});
      if (result.success) {
        alert('Invitation declined');
        // Remove from list
        setTeamInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation');
    }
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
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
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
              {/* Team Invitations */}
              {teamInvitations.map(invitation => (
                <div key={invitation.id} className="notification-item notification-invitation">
                  <div className="notification-icon notification-icon-team">
                    <UsersIcon className="notification-svg-icon" />
                  </div>
                  <div className="notification-text">
                    <h4>Team Invitation</h4>
                    <p>You've been invited to join <strong>{invitation.team_name}</strong></p>
                    <div className="notification-actions">
                      <button 
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="notification-btn-accept"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="notification-btn-decline"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Due Soon Todos */}
              {dueSoonTodos.map(todo => (
                <div key={todo.id} className={`notification-item notification-${todo.urgency}`}>
                  <div className={`notification-icon notification-icon-${todo.urgency}`}>
                    {todo.urgency === 'critical' ? (
                      <AlertIcon className="notification-svg-icon" />
                    ) : todo.urgency === 'warning' ? (
                      <ClockIcon className="notification-svg-icon" />
                    ) : (
                      <CalendarIcon className="notification-svg-icon" />
                    )}
                  </div>
                  <div className="notification-text">
                    <h4>{todo.name}</h4>
                    <p>{todo.description}</p>
                    <span className="notification-time">{todo.timeText}</span>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {teamInvitations.length === 0 && dueSoonTodos.length === 0 && (
                <div className="notifications-empty">
                  <p>No new notifications! 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

