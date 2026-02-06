import { Todo } from '../types/database.types';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onEdit, onDelete }: TodoItemProps) {
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

  return (
    <div className={`todo-item ${isOverdue() ? 'overdue' : ''}`}>
      <div className="todo-content">
        <div className="todo-header-row">
          <h3 className="todo-name">{todo.name}</h3>
          <span 
            className="todo-status-badge"
            style={{ backgroundColor: getStatusColor(todo.status) }}
          >
            {getStatusLabel(todo.status)}
          </span>
        </div>
        
        <p className="todo-description">{todo.description}</p>
        
        <div className="todo-meta">
          <span className="todo-due-date">
            📅 Due: {formatDate(todo.due_date)}
            {isOverdue() && <span className="overdue-label"> (Overdue)</span>}
          </span>
        </div>
      </div>

      <div className="todo-actions">
        <button 
          onClick={() => onEdit(todo)}
          className="btn-edit"
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(todo.id)}
          className="btn-delete"
        >
          Delete
        </button>
      </div>
    </div>
  );
}


