import { useState, useEffect } from 'react';
import { Todo, TodoStatus, WorkSession } from '../types/database.types';
import { api, getCurrentUser } from '../utils/api';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onQuickUpdate?: (id: string, updates: Partial<Todo>) => void;
  isTeamMode?: boolean;
  onWorkStarted?: () => void;
}

export function TodoItem({ todo, onEdit, onDelete, onQuickUpdate, isTeamMode, onWorkStarted }: TodoItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Check if current user is the owner
    const checkOwnership = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        setIsOwner(user.id === todo.user_id);
      }
    };
    checkOwnership();

    fetchWorkSessions();
    checkActiveSession();

    // Poll for work session updates only if todo is in progress (reduced from 10s to 30s)
    let interval: NodeJS.Timeout | null = null;
    if (todo.status === 'IN_PROGRESS') {
      interval = setInterval(() => {
        fetchWorkSessions();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todo.id, todo.status, todo.user_id, isTeamMode]);

  const fetchWorkSessions = async () => {
    try {
      const result = await api.get<WorkSession[]>(`/api/work-sessions/todo/${todo.id}`);
      if (result.success && result.data) {
        setWorkSessions(result.data);
        
        // After fetching, check if current user has an active session
        if (currentUserId) {
          const userActiveSessions = result.data.filter(s => !s.ended_at && s.user_id === currentUserId);
          if (userActiveSessions.length > 0) {
            setActiveSession(userActiveSessions[0]);
            setIsWorking(true);
          } else {
            setActiveSession(null);
            setIsWorking(false);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching work sessions:', error);
    }
  };

  const checkActiveSession = async () => {
    try {
      if (!currentUserId) return;
      
      // Check if current user has an active session on this todo
      const sessions = workSessions.filter(s => !s.ended_at && s.user_id === currentUserId);
      if (sessions.length > 0) {
        setActiveSession(sessions[0]);
        setIsWorking(true);
      } else {
        setActiveSession(null);
        setIsWorking(false);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const handleStartWork = async () => {
    try {
      setIsUpdating(true);
      const result = await api.post('/api/work-sessions/start', { todo_id: todo.id });
      if (result.success && result.data) {
        setActiveSession(result.data);
        setIsWorking(true);
        await fetchWorkSessions();
      } else {
        alert(result.error || 'Failed to start work session');
      }
    } catch (error) {
      console.error('Error starting work:', error);
      alert('Failed to start work session');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStopWork = async () => {
    if (!activeSession) return;
    try {
      setIsUpdating(true);
      const result = await api.post(`/api/work-sessions/stop/${activeSession.id}`, {});
      if (result.success) {
        setActiveSession(null);
        setIsWorking(false);
        await fetchWorkSessions();
      } else {
        alert(result.error || 'Failed to stop work session');
      }
    } catch (error) {
      console.error('Error stopping work:', error);
      alert('Failed to stop work session');
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateTotalTime = (): number => {
    return workSessions.reduce((total, session) => {
      return total + (session.duration_minutes || 0);
    }, 0);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getUserColor = (email: string): string => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return '#94a3b8';
      case 'IN_PROGRESS':
        return '#3b82f6';
      case 'COMPLETED':
        return '#10b981';
      default:
        return '#000000';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = () => {
    if (todo.status === 'COMPLETED') return false;
    return new Date(todo.due_date) < new Date();
  };

  const handleStatusChange = async (newStatus: TodoStatus) => {
    if (!onQuickUpdate) return;
    
    // For team tasks, only owner can mark as completed
    if (isTeamMode && newStatus === 'COMPLETED' && !isOwner) {
      alert('Only the task owner can mark this task as completed');
      return;
    }
    
    setIsUpdating(true);
    
    // Auto-manage work sessions based on status (for both personal and team)
    if (newStatus === 'IN_PROGRESS' && todo.status !== 'IN_PROGRESS') {
      // Starting work - create session
      await handleStartWork();
    } else if (newStatus !== 'IN_PROGRESS' && todo.status === 'IN_PROGRESS') {
      // Stopping work - end session
      if (activeSession) {
        await handleStopWork();
      }
    }
    
    await onQuickUpdate(todo.id, { status: newStatus });
    
    // Refresh work sessions after status change
    setTimeout(() => {
      fetchWorkSessions();
      checkActiveSession();
    }, 500);
    
    setIsUpdating(false);
  };

  const handleWorkButton = async () => {
    if (!onQuickUpdate) return;
    setIsUpdating(true);
    
    // Start work session and change status to IN_PROGRESS
    await handleStartWork();
    await onQuickUpdate(todo.id, { status: 'IN_PROGRESS' });
    
    // Notify parent to switch to calendar view (for team mode)
    if (isTeamMode && onWorkStarted) {
      onWorkStarted();
    }
    
    // Refresh work sessions after status change
    setTimeout(() => {
      fetchWorkSessions();
      checkActiveSession();
    }, 500);
    
    setIsUpdating(false);
  };

  const handleDateChange = async (newDate: string) => {
    if (!onQuickUpdate || !newDate) return;
    setIsUpdating(true);
    await onQuickUpdate(todo.id, { due_date: new Date(newDate).toISOString() });
    setIsUpdating(false);
  };

  const getContainerClass = () => {
    const baseClass = 'todo-item';
    const statusClass = `status-${todo.status.toLowerCase()}`;
    const overdueClass = isOverdue() ? 'overdue' : '';
    return `${baseClass} ${statusClass} ${overdueClass}`.trim();
  };

  return (
    <div className={getContainerClass()}>
      <div className="todo-content">
        <div className="todo-header-row">
          <h3 className="todo-name">{todo.name}</h3>
          <div className="todo-badges">
            {isTeamMode && todo.creator_email && (
              <span className="creator-badge">{todo.creator_email}</span>
            )}
            {isTeamMode && <span className="team-badge">Team</span>}
          </div>
        </div>
        
        <p className="todo-description">{todo.description}</p>
        
        <div className="todo-quick-actions">
          {/* Work Button for Team Tasks */}
          {isTeamMode && todo.status !== 'COMPLETED' && (
            <div className="quick-action-group">
              <button 
                className="btn-work"
                onClick={handleWorkButton}
                disabled={isUpdating || isWorking}
              >
                {isWorking ? '⚡ Working...' : '▶ Work'}
              </button>
            </div>
          )}

          {/* Custom Status Dropdown */}
          <div className="quick-action-group">
            <label>Status</label>
            <div className="custom-select-wrapper">
              <button 
                className={`custom-select-button status-${todo.status.toLowerCase()}`}
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={isUpdating}
              >
                <span className="status-indicator" style={{ backgroundColor: getStatusColor(todo.status) }}></span>
                {getStatusLabel(todo.status)}
                <span className="dropdown-arrow">{showStatusDropdown ? '▲' : '▼'}</span>
              </button>
              {showStatusDropdown && (
                <div className="custom-select-dropdown">
                  <button
                    className="custom-option"
                    onClick={() => {
                      handleStatusChange('NOT_STARTED');
                      setShowStatusDropdown(false);
                    }}
                  >
                    <span className="status-indicator" style={{ backgroundColor: getStatusColor('NOT_STARTED') }}></span>
                    Not Started
                  </button>
                  <button
                    className="custom-option"
                    onClick={() => {
                      handleStatusChange('IN_PROGRESS');
                      setShowStatusDropdown(false);
                    }}
                  >
                    <span className="status-indicator" style={{ backgroundColor: getStatusColor('IN_PROGRESS') }}></span>
                    In Progress
                  </button>
                  <button
                    className={`custom-option ${isTeamMode && !isOwner ? 'disabled' : ''}`}
                    onClick={() => {
                      handleStatusChange('COMPLETED');
                      setShowStatusDropdown(false);
                    }}
                    disabled={isTeamMode && !isOwner}
                    title={isTeamMode && !isOwner ? 'Only the task owner can mark as completed' : ''}
                  >
                    <span className="status-indicator" style={{ backgroundColor: getStatusColor('COMPLETED') }}></span>
                    Completed {isTeamMode && !isOwner && '🔒'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Native Date Picker */}
          <div className="quick-action-group">
            <label>Due Date</label>
            <input 
              type="datetime-local"
              value={todo.due_date.slice(0, 16)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="date-input"
              disabled={isUpdating}
            />
          </div>
          
          {isOverdue() && (
            <div className="overdue-badge">
              <span className="overdue-dot"></span>
              <span>Overdue</span>
            </div>
          )}
        </div>

        {/* Progress Tracking - Collapsible */}
        {workSessions.length > 0 && (
          <div className="work-progress-section">
            <div className="progress-header">
              <button 
                onClick={() => setShowProgress(!showProgress)}
                className="btn-toggle-progress"
              >
                {showProgress ? '▼' : '►'} Work Progress (Total: {formatDuration(calculateTotalTime())})
              </button>
            </div>

            {showProgress && (
              <div className="progress-details">
                <div className="progress-bar-container">
                  {(() => {
                    const totalTime = calculateTotalTime();
                    const userTimes = workSessions.reduce((acc, session) => {
                      const email = session.user_email || 'Unknown';
                      acc[email] = (acc[email] || 0) + (session.duration_minutes || 0);
                      return acc;
                    }, {} as Record<string, number>);

                    return (
                      <>
                        <div className="progress-bar">
                          {Object.entries(userTimes).map(([email, time]) => (
                            <div
                              key={email}
                              className="progress-segment"
                              style={{
                                width: `${(time / totalTime) * 100}%`,
                                backgroundColor: getUserColor(email)
                              }}
                              title={isTeamMode ? `${email}: ${formatDuration(time)}` : `${formatDuration(time)}`}
                            />
                          ))}
                        </div>
                        {isTeamMode && (
                          <div className="progress-legend">
                            {Object.entries(userTimes).map(([email, time]) => (
                              <div key={email} className="legend-item">
                                <span 
                                  className="legend-color" 
                                  style={{ backgroundColor: getUserColor(email) }}
                                />
                                <span className="legend-label">{email}</span>
                                <span className="legend-time">{formatDuration(time)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="todo-actions">
        <button 
          onClick={() => onEdit(todo)}
          className="btn-edit"
          title="Edit"
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(todo.id)}
          className="btn-delete"
          title="Delete"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
