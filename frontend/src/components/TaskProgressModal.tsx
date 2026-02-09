import { useState, useEffect } from 'react';
import { Todo, WorkSession } from '../types/database.types';
import { api } from '../utils/api';
import './TaskProgressModal.css';

interface TaskProgressModalProps {
  todo: Todo;
  onClose: () => void;
}

export function TaskProgressModal({ todo, onClose }: TaskProgressModalProps) {
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkSessions();
  }, [todo.id]);

  const fetchWorkSessions = async () => {
    try {
      const result = await api.get<WorkSession[]>(`/api/work-sessions/todo/${todo.id}`);
      if (result.success && result.data) {
        setWorkSessions(result.data);
      }
    } catch (error) {
      console.error('Error fetching work sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalDuration = () => {
    return workSessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
  };

  const getUserStats = () => {
    const stats: Record<string, { minutes: number; sessions: number }> = {};
    workSessions.forEach(session => {
      const email = session.user_email || 'Unknown';
      if (!stats[email]) {
        stats[email] = { minutes: 0, sessions: 0 };
      }
      stats[email].minutes += session.duration_minutes || 0;
      stats[email].sessions += 1;
    });
    return Object.entries(stats).sort((a, b) => b[1].minutes - a[1].minutes);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED': return '#94a3b8';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      default: return '#64748b';
    }
  };

  const getUserColor = (email: string): string => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const totalMinutes = getTotalDuration();
  const userStats = getUserStats();

  return (
    <div className="progress-modal-overlay" onClick={onClose}>
      <div className="progress-modal" onClick={(e) => e.stopPropagation()}>
        <div className="progress-modal-header">
          <div>
            <h2 className="progress-modal-title">{todo.name}</h2>
            <p className="progress-modal-description">{todo.description}</p>
          </div>
          <button className="progress-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="progress-modal-body">
          {/* Status and Total Time */}
          <div className="progress-stats-row">
            <div className="progress-stat-card">
              <div className="stat-label">Status</div>
              <div 
                className="stat-value"
                style={{ color: getStatusColor(todo.status) }}
              >
                {todo.status.replace('_', ' ')}
              </div>
            </div>
            <div className="progress-stat-card">
              <div className="stat-label">Total Work Time</div>
              <div className="stat-value">{formatDuration(totalMinutes)}</div>
            </div>
            <div className="progress-stat-card">
              <div className="stat-label">Work Sessions</div>
              <div className="stat-value">{workSessions.length}</div>
            </div>
          </div>

          {/* Contributors Breakdown */}
          {userStats.length > 0 && (
            <div className="progress-section">
              <h3 className="progress-section-title">Contributors</h3>
              <div className="contributors-list">
                {userStats.map(([email, stats]) => (
                  <div key={email} className="contributor-card">
                    <div className="contributor-header">
                      <div className="contributor-info">
                        <div 
                          className="contributor-avatar"
                          style={{ backgroundColor: getUserColor(email) }}
                        >
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <div className="contributor-details">
                          <div className="contributor-name">{email}</div>
                          <div className="contributor-sessions">{stats.sessions} session{stats.sessions > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="contributor-time">{formatDuration(stats.minutes)}</div>
                    </div>
                    <div className="contributor-progress">
                      <div 
                        className="contributor-progress-bar"
                        style={{
                          width: `${(stats.minutes / totalMinutes) * 100}%`,
                          backgroundColor: getUserColor(email)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Sessions Timeline */}
          <div className="progress-section">
            <h3 className="progress-section-title">Work Timeline</h3>
            {loading ? (
              <div className="timeline-loading">Loading sessions...</div>
            ) : workSessions.length === 0 ? (
              <div className="timeline-empty">No work sessions recorded yet</div>
            ) : (
              <div className="timeline-list">
                {workSessions.map((session, index) => (
                  <div key={session.id} className="timeline-item">
                    <div 
                      className="timeline-dot"
                      style={{ backgroundColor: getUserColor(session.user_email || 'Unknown') }}
                    />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-user">{session.user_email || 'Unknown User'}</span>
                        <span className="timeline-duration">{formatDuration(session.duration_minutes || 0)}</span>
                      </div>
                      <div className="timeline-time">
                        {formatDateTime(session.started_at)}
                        {session.ended_at && ` → ${formatDateTime(session.ended_at)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
