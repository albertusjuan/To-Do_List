import { useState, useEffect } from 'react';
import { Todo, WorkSession } from '../../types/database.types';
import { api } from '../../utils/api';
import { TaskProgressModal } from '../TaskProgressModal';
import './Calendar.css';

interface CalendarProps {
  todos: Todo[];
  onDateClick?: (date: Date) => void;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (id: string) => void;
  onCreateTodo?: (date: Date) => void;
  isTeamMode?: boolean;
  initialSelectedDate?: Date | null;
}

export function Calendar({ todos, onDateClick, onEditTodo, onDeleteTodo, onCreateTodo, isTeamMode = false, initialSelectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Update selected date when initialSelectedDate changes
  useEffect(() => {
    if (initialSelectedDate) {
      setSelectedDate(initialSelectedDate);
      setCurrentDate(initialSelectedDate);
    }
  }, [initialSelectedDate]);
  const [workSessionsByDate, setWorkSessionsByDate] = useState<Record<string, WorkSession[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [progressModalTodo, setProgressModalTodo] = useState<Todo | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  useEffect(() => {
    // Only fetch work sessions if we have todos
    if (todos.length > 0) {
      fetchWorkSessions();
    } else {
      setWorkSessionsByDate({});
    }
  }, [todos.length, currentDate]);

  const fetchWorkSessions = async () => {
    setIsLoading(true);
    try {
      const sessions: Record<string, WorkSession[]> = {};
      
      // Only fetch for todos that might have work sessions (team todos or in-progress/completed)
      const todosWithSessions = todos.filter(
        todo => todo.team_id || todo.status === 'IN_PROGRESS' || todo.status === 'COMPLETED'
      );
      
      if (todosWithSessions.length === 0) {
        setWorkSessionsByDate({});
        setIsLoading(false);
        return;
      }

      // Fetch all work sessions in parallel (limited to 10 at a time to prevent overwhelming the API)
      const batchSize = 10;
      for (let i = 0; i < todosWithSessions.length; i += batchSize) {
        const batch = todosWithSessions.slice(i, i + batchSize);
        const promises = batch.map(todo =>
          api.get<WorkSession[]>(`/api/work-sessions/todo/${todo.id}`)
            .catch(err => {
              console.error(`Error fetching sessions for todo ${todo.id}:`, err);
              return { success: false, data: [] };
            })
        );

        const results = await Promise.all(promises);
        
        results.forEach((result) => {
          if (result.success && result.data && Array.isArray(result.data)) {
            result.data.forEach(session => {
              if (session && session.started_at) {
                const sessionDate = new Date(session.started_at).toDateString();
                if (!sessions[sessionDate]) {
                  sessions[sessionDate] = [];
                }
                sessions[sessionDate].push(session);
              }
            });
          }
        });
      }
      
      setWorkSessionsByDate(sessions);
    } catch (error) {
      console.error('Error fetching work sessions:', error);
      setWorkSessionsByDate({});
    } finally {
      setIsLoading(false);
    }
  };

  const getTodosForDate = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    return todos.filter(todo => {
      const todoDate = new Date(todo.due_date).toDateString();
      return todoDate === dateStr;
    });
  };

  const getWorkProgressForDate = (day: number): Array<{email: string, color: string}> => {
    try {
      const checkDate = new Date(year, month, day);
      const dateStr = checkDate.toDateString();
      const workSessions = workSessionsByDate[dateStr] || [];
      
      if (workSessions.length === 0) return [];
      
      // Get unique users who worked on this day
      const uniqueUsers = Array.from(
        new Set(
          workSessions
            .filter(s => s && s.user_email) // Filter out null/undefined
            .map(s => s.user_email || 'Unknown')
        )
      );
      
      return uniqueUsers.map(email => ({
        email,
        color: getUserColor(email)
      }));
    } catch (error) {
      console.error('Error getting work progress:', error);
      return [];
    }
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

  const getTaskWorkDataForDate = (day: number) => {
    const checkDate = new Date(year, month, day);
    const dateStr = checkDate.toDateString();
    const workSessions = workSessionsByDate[dateStr] || [];
    
    // Find todos that have work sessions on this day
    const todosWithWork = todos.filter(todo => 
      workSessions.some(session => session.todo_id === todo.id)
    );
    
    // Calculate duration and users for each task
    return todosWithWork.map(todo => {
      const todoSessions = workSessions.filter(s => s.todo_id === todo.id);
      const totalMinutes = todoSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const users = Array.from(new Set(todoSessions.map(s => s.user_email || 'Unknown')));
      
      return {
        todo,
        totalMinutes,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        users,
        sessionCount: todoSessions.length
      };
    }).sort((a, b) => b.totalMinutes - a.totalMinutes); // Sort by duration desc
  };

  const formatDuration = (hours: number, minutes: number): string => {
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED': return '○';
      case 'IN_PROGRESS': return '●';
      case 'COMPLETED': return '✓';
      default: return '○';
    }
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    if (onDateClick) {
      onDateClick(clickedDate);
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           month === selectedDate.getMonth() && 
           year === selectedDate.getFullYear();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return '#94a3b8';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      default: return '#000000';
    }
  };

  const selectedDayTodos = selectedDate ? getTodosForDate(selectedDate.getDate()) : [];

  return (
    <div className="calendar-container">
      <div className="calendar-main">
        <div className="calendar-header">
          <button onClick={prevMonth} className="calendar-nav-btn">
            ‹
          </button>
          <h3 className="calendar-title">
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </h3>
          <button onClick={nextMonth} className="calendar-nav-btn">
            ›
          </button>
        </div>
        
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          
          {blanks.map(b => (
            <div key={`blank-${b}`} className="calendar-day blank" />
          ))}
          
          {days.map(day => {
            const dayTodos = getTodosForDate(day);
            const taskWorkData = getTaskWorkDataForDate(day);
            const notStartedCount = dayTodos.filter(t => t.status === 'NOT_STARTED').length;
            const inProgressCount = dayTodos.filter(t => t.status === 'IN_PROGRESS').length;
            const completedCount = dayTodos.filter(t => t.status === 'COMPLETED').length;
            
            return (
              <div
                key={day}
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''} ${dayTodos.length > 0 ? 'has-todos' : ''} ${taskWorkData.length > 0 ? 'has-work' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <span className="day-number">{day}</span>
                
                {/* Task Progress Cards - Show work done on tasks */}
                {taskWorkData.length > 0 && (
                  <div className="task-progress-cards">
                    {taskWorkData.slice(0, 2).map((taskData, idx) => (
                      <div
                        key={taskData.todo.id}
                        className="task-card"
                        style={{ borderLeftColor: getStatusColor(taskData.todo.status) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setProgressModalTodo(taskData.todo);
                        }}
                      >
                        <div className="task-card-header">
                          <span className="task-name" title={taskData.todo.name}>
                            {taskData.todo.name.length > 15 
                              ? `${taskData.todo.name.substring(0, 15)}...` 
                              : taskData.todo.name}
                          </span>
                          <span className="task-duration">
                            {formatDuration(taskData.hours, taskData.minutes)}
                          </span>
                        </div>
                        <div className="task-card-footer">
                          {taskData.users.length > 0 && (
                            <span className="task-user">
                              👤 {taskData.users[0]}
                              {taskData.users.length > 1 && ` +${taskData.users.length - 1}`}
                            </span>
                          )}
                          <span 
                            className={`task-status status-${taskData.todo.status.toLowerCase()}`}
                            style={{ color: getStatusColor(taskData.todo.status) }}
                          >
                            {getStatusIcon(taskData.todo.status)} {taskData.todo.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {taskWorkData.length > 2 && (
                      <div className="task-card-more">
                        +{taskWorkData.length - 2} more task{taskWorkData.length - 2 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Status count badges */}
                {dayTodos.length > 0 && (
                  <div className="todo-status-counts">
                    {notStartedCount > 0 && (
                      <span className="status-badge not-started" title="Not Started">
                        {notStartedCount}
                      </span>
                    )}
                    {inProgressCount > 0 && (
                      <span className="status-badge in-progress" title="In Progress">
                        {inProgressCount}
                      </span>
                    )}
                    {completedCount > 0 && (
                      <span className="status-badge completed" title="Completed">
                        {completedCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="calendar-sidebar">
          <div className="sidebar-header">
            <h4 className="sidebar-title">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            {onCreateTodo && (
              <button 
                onClick={() => onCreateTodo(selectedDate)}
                className="sidebar-btn-add"
                title="Add new TODO for this date"
              >
                +
              </button>
            )}
          </div>
          
          <div className="sidebar-content">
            {/* Day Summary */}
            <div className="day-summary">
              <div className="summary-stat">
                <span className="stat-number">{selectedDayTodos.length}</span>
                <span className="stat-label">Total Tasks</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">
                  {selectedDayTodos.filter(t => t.status === 'COMPLETED').length}
                </span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">
                  {selectedDayTodos.filter(t => t.status === 'IN_PROGRESS').length}
                </span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>

            {/* Work Activity Timeline (Team Mode Only) */}
            {isTeamMode && selectedDate && (() => {
              // Collect all work sessions that started on the selected date
              const workActivityOnDay: Array<{
                todoName: string;
                todoId: string;
                userEmail: string;
                startedAt: string;
                isActive: boolean;
              }> = [];

              selectedDayTodos.forEach(todo => {
                const sessions = todo.work_sessions || [];
                sessions.forEach(session => {
                  const sessionStartDate = new Date(session.started_at);
                  const selectedDay = selectedDate.getDate();
                  const selectedMonth = selectedDate.getMonth();
                  const selectedYear = selectedDate.getFullYear();
                  
                  // Check if session started on the selected date
                  if (
                    sessionStartDate.getDate() === selectedDay &&
                    sessionStartDate.getMonth() === selectedMonth &&
                    sessionStartDate.getFullYear() === selectedYear
                  ) {
                    workActivityOnDay.push({
                      todoName: todo.name,
                      todoId: todo.id,
                      userEmail: session.user_email || 'Unknown',
                      startedAt: session.started_at,
                      isActive: !session.ended_at
                    });
                  }
                });
              });

              // Sort by start time
              workActivityOnDay.sort((a, b) => 
                new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
              );

              if (workActivityOnDay.length > 0) {
                return (
                  <div className="work-activity-section">
                    <h5 className="section-title">📅 Work Started on This Day</h5>
                    <div className="work-activity-list">
                      {workActivityOnDay.map((activity, idx) => (
                        <div key={`${activity.todoId}-${activity.userEmail}-${idx}`} className="work-activity-item">
                          <div className="activity-time">
                            {new Date(activity.startedAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className="activity-content">
                            <div className="activity-header">
                              <span className="activity-user">👤 {activity.userEmail}</span>
                              {activity.isActive && <span className="activity-active-badge">Active</span>}
                            </div>
                            <div className="activity-task">
                              {idx === 0 || workActivityOnDay[idx - 1].todoName !== activity.todoName
                                ? `Started working on "${activity.todoName}"`
                                : `Joined on "${activity.todoName}"`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Tasks List */}
            {selectedDayTodos.length === 0 ? (
              <div className="no-tasks-message">
                <p>No tasks scheduled for this day</p>
                {onCreateTodo && (
                  <button 
                    onClick={() => onCreateTodo(selectedDate)}
                    className="btn-create-first"
                  >
                    Create your first task
                  </button>
                )}
              </div>
            ) : (
              <div className="sidebar-todos">
                <h5 className="section-title">Tasks for this day</h5>
                {selectedDayTodos.map(todo => (
                  <div 
                    key={todo.id} 
                    className="sidebar-todo-item"
                    style={{ borderLeftColor: getStatusColor(todo.status) }}
                    onClick={() => onEditTodo(todo)}
                  >
                    <div className="sidebar-todo-header">
                      <h6>{todo.name}</h6>
                      <span 
                        className="sidebar-status-badge"
                        style={{ backgroundColor: getStatusColor(todo.status) }}
                      >
                        {getStatusIcon(todo.status)}
                      </span>
                    </div>
                    {todo.description && (
                      <p className="sidebar-todo-desc">{todo.description}</p>
                    )}
                    <div className="sidebar-todo-meta">
                      <span className="todo-time">
                        {new Date(todo.due_date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {todo.creator_email && (
                        <span className="todo-creator">👤 {todo.creator_email}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Details Modal */}
      {progressModalTodo && (
        <TaskProgressModal
          todo={progressModalTodo}
          onClose={() => setProgressModalTodo(null)}
        />
      )}
    </div>
  );
}


import { api } from '../../utils/api';
import { TaskProgressModal } from '../TaskProgressModal';
import './Calendar.css';

interface CalendarProps {
  todos: Todo[];
  onDateClick?: (date: Date) => void;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (id: string) => void;
  onCreateTodo?: (date: Date) => void;
  isTeamMode?: boolean;
  initialSelectedDate?: Date | null;
}

export function Calendar({ todos, onDateClick, onEditTodo, onDeleteTodo, onCreateTodo, isTeamMode = false, initialSelectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Update selected date when initialSelectedDate changes
  useEffect(() => {
    if (initialSelectedDate) {
      setSelectedDate(initialSelectedDate);
      setCurrentDate(initialSelectedDate);
    }
  }, [initialSelectedDate]);
  const [workSessionsByDate, setWorkSessionsByDate] = useState<Record<string, WorkSession[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [progressModalTodo, setProgressModalTodo] = useState<Todo | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  useEffect(() => {
    // Only fetch work sessions if we have todos
    if (todos.length > 0) {
      fetchWorkSessions();
    } else {
      setWorkSessionsByDate({});
    }
  }, [todos.length, currentDate]);

  const fetchWorkSessions = async () => {
    setIsLoading(true);
    try {
      const sessions: Record<string, WorkSession[]> = {};
      
      // Only fetch for todos that might have work sessions (team todos or in-progress/completed)
      const todosWithSessions = todos.filter(
        todo => todo.team_id || todo.status === 'IN_PROGRESS' || todo.status === 'COMPLETED'
      );
      
      if (todosWithSessions.length === 0) {
        setWorkSessionsByDate({});
        setIsLoading(false);
        return;
      }

      // Fetch all work sessions in parallel (limited to 10 at a time to prevent overwhelming the API)
      const batchSize = 10;
      for (let i = 0; i < todosWithSessions.length; i += batchSize) {
        const batch = todosWithSessions.slice(i, i + batchSize);
        const promises = batch.map(todo =>
          api.get<WorkSession[]>(`/api/work-sessions/todo/${todo.id}`)
            .catch(err => {
              console.error(`Error fetching sessions for todo ${todo.id}:`, err);
              return { success: false, data: [] };
            })
        );

        const results = await Promise.all(promises);
        
        results.forEach((result) => {
          if (result.success && result.data && Array.isArray(result.data)) {
            result.data.forEach(session => {
              if (session && session.started_at) {
                const sessionDate = new Date(session.started_at).toDateString();
                if (!sessions[sessionDate]) {
                  sessions[sessionDate] = [];
                }
                sessions[sessionDate].push(session);
              }
            });
          }
        });
      }
      
      setWorkSessionsByDate(sessions);
    } catch (error) {
      console.error('Error fetching work sessions:', error);
      setWorkSessionsByDate({});
    } finally {
      setIsLoading(false);
    }
  };

  const getTodosForDate = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    return todos.filter(todo => {
      const todoDate = new Date(todo.due_date).toDateString();
      return todoDate === dateStr;
    });
  };

  const getWorkProgressForDate = (day: number): Array<{email: string, color: string}> => {
    try {
      const checkDate = new Date(year, month, day);
      const dateStr = checkDate.toDateString();
      const workSessions = workSessionsByDate[dateStr] || [];
      
      if (workSessions.length === 0) return [];
      
      // Get unique users who worked on this day
      const uniqueUsers = Array.from(
        new Set(
          workSessions
            .filter(s => s && s.user_email) // Filter out null/undefined
            .map(s => s.user_email || 'Unknown')
        )
      );
      
      return uniqueUsers.map(email => ({
        email,
        color: getUserColor(email)
      }));
    } catch (error) {
      console.error('Error getting work progress:', error);
      return [];
    }
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

  const getTaskWorkDataForDate = (day: number) => {
    const checkDate = new Date(year, month, day);
    const dateStr = checkDate.toDateString();
    const workSessions = workSessionsByDate[dateStr] || [];
    
    // Find todos that have work sessions on this day
    const todosWithWork = todos.filter(todo => 
      workSessions.some(session => session.todo_id === todo.id)
    );
    
    // Calculate duration and users for each task
    return todosWithWork.map(todo => {
      const todoSessions = workSessions.filter(s => s.todo_id === todo.id);
      const totalMinutes = todoSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const users = Array.from(new Set(todoSessions.map(s => s.user_email || 'Unknown')));
      
      return {
        todo,
        totalMinutes,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        users,
        sessionCount: todoSessions.length
      };
    }).sort((a, b) => b.totalMinutes - a.totalMinutes); // Sort by duration desc
  };

  const formatDuration = (hours: number, minutes: number): string => {
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED': return '○';
      case 'IN_PROGRESS': return '●';
      case 'COMPLETED': return '✓';
      default: return '○';
    }
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    if (onDateClick) {
      onDateClick(clickedDate);
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           month === selectedDate.getMonth() && 
           year === selectedDate.getFullYear();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return '#94a3b8';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      default: return '#000000';
    }
  };

  const selectedDayTodos = selectedDate ? getTodosForDate(selectedDate.getDate()) : [];

  return (
    <div className="calendar-container">
      <div className="calendar-main">
        <div className="calendar-header">
          <button onClick={prevMonth} className="calendar-nav-btn">
            ‹
          </button>
          <h3 className="calendar-title">
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </h3>
          <button onClick={nextMonth} className="calendar-nav-btn">
            ›
          </button>
        </div>
        
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          
          {blanks.map(b => (
            <div key={`blank-${b}`} className="calendar-day blank" />
          ))}
          
          {days.map(day => {
            const dayTodos = getTodosForDate(day);
            const taskWorkData = getTaskWorkDataForDate(day);
            const notStartedCount = dayTodos.filter(t => t.status === 'NOT_STARTED').length;
            const inProgressCount = dayTodos.filter(t => t.status === 'IN_PROGRESS').length;
            const completedCount = dayTodos.filter(t => t.status === 'COMPLETED').length;
            
            return (
              <div
                key={day}
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''} ${dayTodos.length > 0 ? 'has-todos' : ''} ${taskWorkData.length > 0 ? 'has-work' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <span className="day-number">{day}</span>
                
                {/* Task Progress Cards - Show work done on tasks */}
                {taskWorkData.length > 0 && (
                  <div className="task-progress-cards">
                    {taskWorkData.slice(0, 2).map((taskData, idx) => (
                      <div
                        key={taskData.todo.id}
                        className="task-card"
                        style={{ borderLeftColor: getStatusColor(taskData.todo.status) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setProgressModalTodo(taskData.todo);
                        }}
                      >
                        <div className="task-card-header">
                          <span className="task-name" title={taskData.todo.name}>
                            {taskData.todo.name.length > 15 
                              ? `${taskData.todo.name.substring(0, 15)}...` 
                              : taskData.todo.name}
                          </span>
                          <span className="task-duration">
                            {formatDuration(taskData.hours, taskData.minutes)}
                          </span>
                        </div>
                        <div className="task-card-footer">
                          {taskData.users.length > 0 && (
                            <span className="task-user">
                              👤 {taskData.users[0]}
                              {taskData.users.length > 1 && ` +${taskData.users.length - 1}`}
                            </span>
                          )}
                          <span 
                            className={`task-status status-${taskData.todo.status.toLowerCase()}`}
                            style={{ color: getStatusColor(taskData.todo.status) }}
                          >
                            {getStatusIcon(taskData.todo.status)} {taskData.todo.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {taskWorkData.length > 2 && (
                      <div className="task-card-more">
                        +{taskWorkData.length - 2} more task{taskWorkData.length - 2 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Status count badges */}
                {dayTodos.length > 0 && (
                  <div className="todo-status-counts">
                    {notStartedCount > 0 && (
                      <span className="status-badge not-started" title="Not Started">
                        {notStartedCount}
                      </span>
                    )}
                    {inProgressCount > 0 && (
                      <span className="status-badge in-progress" title="In Progress">
                        {inProgressCount}
                      </span>
                    )}
                    {completedCount > 0 && (
                      <span className="status-badge completed" title="Completed">
                        {completedCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="calendar-sidebar">
          <div className="sidebar-header">
            <h4 className="sidebar-title">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            {onCreateTodo && (
              <button 
                onClick={() => onCreateTodo(selectedDate)}
                className="sidebar-btn-add"
                title="Add new TODO for this date"
              >
                +
              </button>
            )}
          </div>
          
          <div className="sidebar-content">
            {/* Day Summary */}
            <div className="day-summary">
              <div className="summary-stat">
                <span className="stat-number">{selectedDayTodos.length}</span>
                <span className="stat-label">Total Tasks</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">
                  {selectedDayTodos.filter(t => t.status === 'COMPLETED').length}
                </span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">
                  {selectedDayTodos.filter(t => t.status === 'IN_PROGRESS').length}
                </span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>

            {/* Work Activity Timeline (Team Mode Only) */}
            {isTeamMode && selectedDate && (() => {
              // Collect all work sessions that started on the selected date
              const workActivityOnDay: Array<{
                todoName: string;
                todoId: string;
                userEmail: string;
                startedAt: string;
                isActive: boolean;
              }> = [];

              selectedDayTodos.forEach(todo => {
                const sessions = todo.work_sessions || [];
                sessions.forEach(session => {
                  const sessionStartDate = new Date(session.started_at);
                  const selectedDay = selectedDate.getDate();
                  const selectedMonth = selectedDate.getMonth();
                  const selectedYear = selectedDate.getFullYear();
                  
                  // Check if session started on the selected date
                  if (
                    sessionStartDate.getDate() === selectedDay &&
                    sessionStartDate.getMonth() === selectedMonth &&
                    sessionStartDate.getFullYear() === selectedYear
                  ) {
                    workActivityOnDay.push({
                      todoName: todo.name,
                      todoId: todo.id,
                      userEmail: session.user_email || 'Unknown',
                      startedAt: session.started_at,
                      isActive: !session.ended_at
                    });
                  }
                });
              });

              // Sort by start time
              workActivityOnDay.sort((a, b) => 
                new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
              );

              if (workActivityOnDay.length > 0) {
                return (
                  <div className="work-activity-section">
                    <h5 className="section-title">📅 Work Started on This Day</h5>
                    <div className="work-activity-list">
                      {workActivityOnDay.map((activity, idx) => (
                        <div key={`${activity.todoId}-${activity.userEmail}-${idx}`} className="work-activity-item">
                          <div className="activity-time">
                            {new Date(activity.startedAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className="activity-content">
                            <div className="activity-header">
                              <span className="activity-user">👤 {activity.userEmail}</span>
                              {activity.isActive && <span className="activity-active-badge">Active</span>}
                            </div>
                            <div className="activity-task">
                              {idx === 0 || workActivityOnDay[idx - 1].todoName !== activity.todoName
                                ? `Started working on "${activity.todoName}"`
                                : `Joined on "${activity.todoName}"`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Tasks List */}
            {selectedDayTodos.length === 0 ? (
              <div className="no-tasks-message">
                <p>No tasks scheduled for this day</p>
                {onCreateTodo && (
                  <button 
                    onClick={() => onCreateTodo(selectedDate)}
                    className="btn-create-first"
                  >
                    Create your first task
                  </button>
                )}
              </div>
            ) : (
              <div className="sidebar-todos">
                <h5 className="section-title">Tasks for this day</h5>
                {selectedDayTodos.map(todo => (
                  <div 
                    key={todo.id} 
                    className="sidebar-todo-item"
                    style={{ borderLeftColor: getStatusColor(todo.status) }}
                    onClick={() => onEditTodo(todo)}
                  >
                    <div className="sidebar-todo-header">
                      <h6>{todo.name}</h6>
                      <span 
                        className="sidebar-status-badge"
                        style={{ backgroundColor: getStatusColor(todo.status) }}
                      >
                        {getStatusIcon(todo.status)}
                      </span>
                    </div>
                    {todo.description && (
                      <p className="sidebar-todo-desc">{todo.description}</p>
                    )}
                    <div className="sidebar-todo-meta">
                      <span className="todo-time">
                        {new Date(todo.due_date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {todo.creator_email && (
                        <span className="todo-creator">👤 {todo.creator_email}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Details Modal */}
      {progressModalTodo && (
        <TaskProgressModal
          todo={progressModalTodo}
          onClose={() => setProgressModalTodo(null)}
        />
      )}
    </div>
  );
}

