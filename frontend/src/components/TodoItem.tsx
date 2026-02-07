import { useState } from 'react';
import { Todo, TodoStatus } from '../types/database.types';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onQuickUpdate?: (id: string, updates: Partial<Todo>) => void;
  isTeamMode?: boolean;
}

export function TodoItem({ todo, onEdit, onDelete, onQuickUpdate, isTeamMode }: TodoItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
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
    setIsUpdating(true);
    await onQuickUpdate(todo.id, { status: newStatus });
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
              <span className="creator-badge">👤 {todo.creator_email}</span>
            )}
            {isTeamMode && <span className="team-badge">Team</span>}
          </div>
        </div>
        
        <p className="todo-description">{todo.description}</p>
        
        <div className="todo-quick-actions">
          <div className="quick-action-group">
            <label>Status</label>
            <select 
              value={todo.status}
              onChange={(e) => handleStatusChange(e.target.value as TodoStatus)}
              className="status-select"
              disabled={isUpdating}
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          
          <div className="quick-action-group">
            <label>Due Date</label>
            <input 
              type="date"
              value={new Date(todo.due_date).toISOString().split('T')[0]}
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


