import { useState, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Todo, TodoStatus, CreateTodoInput } from '../types/database.types';
import { api } from '../utils/api';
import './TodoForm.css';

interface TodoFormProps {
  todo: Todo | null;
  defaultDate?: Date | null;
  teamId?: string | null;
  isTeamMode?: boolean;
  onClose: (refresh?: boolean) => void;
}

export function TodoForm({ todo, defaultDate, teamId, isTeamMode, onClose }: TodoFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TodoStatus>('NOT_STARTED');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId || '');
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isTeamMode) {
      fetchTeams();
    }
  }, [isTeamMode]);

  useEffect(() => {
    if (todo) {
      setName(todo.name);
      setDescription(todo.description);
      // Format date for input[type="datetime-local"]
      const date = new Date(todo.due_date);
      const formatted = date.toISOString().slice(0, 16);
      setDueDate(formatted);
      setStatus(todo.status);
      setSelectedTeamId(todo.team_id || '');
    } else if (defaultDate) {
      // Set default date for new todo in calendar mode
      const formatted = defaultDate.toISOString().slice(0, 16);
      setDueDate(formatted);
    }
  }, [todo, defaultDate]);

  const fetchTeams = async () => {
    try {
      const result = await api.get('/api/teams');
      if (result.success && result.data) {
        setTeams(result.data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

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
        team_id: isTeamMode && selectedTeamId ? selectedTeamId : null,
      };

      const url = todo ? `/api/todos/${todo.id}` : '/api/todos';
      const result = todo
        ? await api.put(url, todoData)
        : await api.post(url, todoData);

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

          {isTeamMode && (
            <div className="form-group">
              <label htmlFor="team">Team (Optional)</label>
              <select
                id="team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="">No Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {teams.length === 0 && (
                <small className="form-hint">
                  No teams available. <a href="/teams" target="_blank">Create a team first</a>
                </small>
              )}
            </div>
          )}

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

import { Todo, TodoStatus, CreateTodoInput } from '../types/database.types';
import { api } from '../utils/api';
import './TodoForm.css';

interface TodoFormProps {
  todo: Todo | null;
  defaultDate?: Date | null;
  teamId?: string | null;
  isTeamMode?: boolean;
  onClose: (refresh?: boolean) => void;
}

export function TodoForm({ todo, defaultDate, teamId, isTeamMode, onClose }: TodoFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TodoStatus>('NOT_STARTED');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId || '');
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isTeamMode) {
      fetchTeams();
    }
  }, [isTeamMode]);

  useEffect(() => {
    if (todo) {
      setName(todo.name);
      setDescription(todo.description);
      // Format date for input[type="datetime-local"]
      const date = new Date(todo.due_date);
      const formatted = date.toISOString().slice(0, 16);
      setDueDate(formatted);
      setStatus(todo.status);
      setSelectedTeamId(todo.team_id || '');
    } else if (defaultDate) {
      // Set default date for new todo in calendar mode
      const formatted = defaultDate.toISOString().slice(0, 16);
      setDueDate(formatted);
    }
  }, [todo, defaultDate]);

  const fetchTeams = async () => {
    try {
      const result = await api.get('/api/teams');
      if (result.success && result.data) {
        setTeams(result.data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

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
        team_id: isTeamMode && selectedTeamId ? selectedTeamId : null,
      };

      const url = todo ? `/api/todos/${todo.id}` : '/api/todos';
      const result = todo
        ? await api.put(url, todoData)
        : await api.post(url, todoData);

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

          {isTeamMode && (
            <div className="form-group">
              <label htmlFor="team">Team (Optional)</label>
              <select
                id="team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="">No Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {teams.length === 0 && (
                <small className="form-hint">
                  No teams available. <a href="/teams" target="_blank">Create a team first</a>
                </small>
              )}
            </div>
          )}

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
