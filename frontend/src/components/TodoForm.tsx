import { useState, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Todo, TodoStatus, CreateTodoInput } from '../types/database.types';
import './TodoForm.css';

interface TodoFormProps {
  todo: Todo | null;
  onClose: (refresh?: boolean) => void;
}

export function TodoForm({ todo, onClose }: TodoFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TodoStatus>('NOT_STARTED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (todo) {
      setName(todo.name);
      setDescription(todo.description);
      // Format date for input[type="datetime-local"]
      const date = new Date(todo.due_date);
      const formatted = date.toISOString().slice(0, 16);
      setDueDate(formatted);
      setStatus(todo.status);
    }
  }, [todo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const todoData: CreateTodoInput = {
        name,
        description,
        due_date: new Date(dueDate).toISOString(),
        status,
      };

      const url = todo ? `/api/todos/${todo.id}` : '/api/todos';
      const method = todo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });

      const result = await response.json();

      if (result.success) {
        onClose(true);
      } else {
        setError(result.error || 'Failed to save TODO');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="todo-form-overlay">
      <div className="todo-form-modal">
        <div className="todo-form-header">
          <h2>{todo ? 'Edit TODO' : 'Create New TODO'}</h2>
          <button onClick={() => onClose()} className="btn-close">×</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} className="todo-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TodoStatus)}
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => onClose()} 
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : (todo ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
