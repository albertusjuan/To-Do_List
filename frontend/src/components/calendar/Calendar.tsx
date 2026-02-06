import { useState } from 'react';
import { Todo } from '../../types/database.types';
import './Calendar.css';

interface CalendarProps {
  todos: Todo[];
  onDateClick?: (date: Date) => void;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (id: string) => void;
  onCreateTodo?: (date: Date) => void;
}

export function Calendar({ todos, onDateClick, onEditTodo, onDeleteTodo, onCreateTodo }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

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

  const getTodosForDate = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    return todos.filter(todo => {
      const todoDate = new Date(todo.due_date).toDateString();
      return todoDate === dateStr;
    });
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
            const hasOverdue = dayTodos.some(t => 
              t.status !== 'COMPLETED' && new Date(t.due_date) < new Date()
            );
            
            return (
              <div
                key={day}
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''} ${dayTodos.length > 0 ? 'has-todos' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <span className="day-number">{day}</span>
                {dayTodos.length > 0 && (
                  <div className="todo-indicators">
                    {hasOverdue && <span className="overdue-indicator">!</span>}
                    <span className="todo-count">{dayTodos.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="calendar-sidebar">
          <h4 className="sidebar-title">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          
          <div className="sidebar-content">
            {selectedDayTodos.length === 0 ? (
              <p className="no-todos">No TODOs for this date</p>
            ) : (
              <div className="sidebar-todos">
                {selectedDayTodos.map(todo => (
                  <div key={todo.id} className="sidebar-todo-item">
                    <div className="sidebar-todo-header">
                      <h5>{todo.name}</h5>
                      <span 
                        className="sidebar-status-badge"
                        style={{ backgroundColor: getStatusColor(todo.status) }}
                      >
                        {todo.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="sidebar-todo-desc">{todo.description}</p>
                    <div className="sidebar-todo-actions">
                      <button 
                        onClick={() => onEditTodo(todo)}
                        className="sidebar-btn-edit"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDeleteTodo(todo.id)}
                        className="sidebar-btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {onCreateTodo && (
              <button 
                onClick={() => onCreateTodo(selectedDate)}
                className="sidebar-btn-create"
              >
                + New TODO
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

