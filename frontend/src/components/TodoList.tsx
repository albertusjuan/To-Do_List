import { useState, useEffect } from 'react';
import { Todo, TodoStatus } from '../types/database.types';
import { TodoItem } from './TodoItem';
import { TodoForm } from './TodoForm';
import { Calendar } from './calendar/Calendar';
import { TeamsView } from './TeamsView';
import { ViewMode } from '../pages/Main';
import { api } from '../utils/api';
import './TodoList.css';

interface TodoListProps {
  userId?: string;
  mode: ViewMode;
}

export function TodoList({ userId, mode }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filterStatus, setFilterStatus] = useState<TodoStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'due_date' | 'status' | 'name'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'teams'>('list');
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);

  // Reset to list view when switching from team to personal mode
  useEffect(() => {
    if (mode === 'personal' && viewMode === 'teams') {
      setViewMode('list');
    }
  }, [mode, viewMode]);

  // Fetch teams when in team mode
  useEffect(() => {
    const fetchTeams = async () => {
      if (mode === 'team') {
        try {
          const result = await api.get('/api/teams');
          if (result.success && result.data) {
            setTeams(result.data);
            // Auto-select first team if available
            if (result.data.length > 0 && !selectedTeamId) {
              setSelectedTeamId(result.data[0].id);
            }
          }
        } catch (error) {
          console.error('Error fetching teams:', error);
        }
      }
    };
    fetchTeams();
  }, [mode]);

  useEffect(() => {
    fetchTodos();

    // Poll for updates every 1h  in team mode to sync status changes
    let pollInterval: NodeJS.Timeout | null = null;
    if (mode === 'team' && selectedTeamId) {
      pollInterval = setInterval(() => {
        fetchTodos();
      }, 3600000); // Refresh every 1h
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [filterStatus, sortBy, sortOrder, mode, selectedTeamId]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      let url = `/api/todos?sort_by=${sortBy}&sort_order=${sortOrder}`;
      
      if (filterStatus !== 'ALL') {
        url += `&status=${filterStatus}`;
      }

      // Add team_id for team mode
      if (mode === 'team' && selectedTeamId) {
        url += `&team_id=${selectedTeamId}`;
      }

      const result = await api.get<Todo[]>(url);
      
      if (result.success && result.data) {
        setTodos(result.data);
      } else {
        console.error('Error fetching todos:', result.error);
        // Don't show alert for team access denied - just show empty list
        if (result.error !== 'Access denied to team todos') {
          alert(`Failed to fetch todos: ${result.error}`);
        }
        setTodos([]);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTodo(null);
    setDefaultDate(null);
    setShowForm(true);
  };

  const handleCreateWithDate = (date: Date) => {
    setEditingTodo(null);
    setDefaultDate(date);
    setShowForm(true);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setDefaultDate(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this TODO?')) return;

    try {
      const result = await api.delete(`/api/todos/${id}`);

      if (result.success) {
        fetchTodos();
      } else {
        alert(`Failed to delete todo: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleFormClose = (refresh?: boolean) => {
    setShowForm(false);
    setEditingTodo(null);
    setDefaultDate(null);
    if (refresh) {
      fetchTodos();
    }
  };

  const handleQuickUpdate = async (id: string, updates: Partial<Todo>) => {
    try {
        // Optimistic update - update UI immediately
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, ...updates } : todo
        )
      );

      // Find the current todo to merge with updates for API call
      const currentTodo = todos.find(t => t.id === id);
      if (!currentTodo) return;

      // Merge current todo with updates
      const updatedTodo = {
        name: currentTodo.name,
        description: currentTodo.description,
        due_date: currentTodo.due_date,
        status: currentTodo.status,
        ...updates
      };

      // Send update to server in background
      const result = await api.put(`/api/todos/${id}`, updatedTodo);

      // If server update fails, revert the change
      if (!result.success) {
        console.error('Error updating todo:', result.error);
        fetchTodos();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      // Revert on error
      fetchTodos();
    }
  };

  const handleWorkStarted = () => {
    // Switch to calendar view and select today's date
    setViewMode('calendar');
    setCalendarSelectedDate(new Date());
  };

  if (loading) {
    return <div className="todo-loading">Loading todos...</div>;
  }

  return (
    <div className="todo-list-container">
      <div className="todo-header">
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            Calendar
          </button>
          {mode === 'team' && (
            <button 
              className={`toggle-btn ${viewMode === 'teams' ? 'active' : ''}`}
              onClick={() => setViewMode('teams')}
            >
              Teams
            </button>
          )}
        </div>
        {viewMode === 'list' && (
          <button onClick={handleCreate} className="btn-create">
            + New TODO
          </button>
        )}
      </div>

      {mode === 'team' && viewMode !== 'teams' && teams.length > 0 && (
        <div className="team-selector-refined">
          <div className="team-selector-header">
            <svg className="team-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="team-selector-label">Active Team</span>
          </div>
          <div className="team-selector-dropdown">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`team-option ${selectedTeamId === team.id ? 'active' : ''}`}
              >
                <span className="team-option-name">{team.name}</span>
                {selectedTeamId === team.id && (
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="todo-controls">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as TodoStatus | 'ALL')}
              className="filter-select"
            >
              <option value="ALL">All</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="sort-group">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'due_date' | 'status' | 'name')}
              className="sort-select"
            >
              <option value="due_date">Due Date</option>
              <option value="status">Status</option>
              <option value="name">Name</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-sort-order"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="todo-list">
          {todos.length === 0 ? (
            <div className="todo-empty">
              <p>No TODOs found. Create your first one!</p>
            </div>
          ) : (
            todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onQuickUpdate={handleQuickUpdate}
                isTeamMode={mode === 'team'}
                onWorkStarted={handleWorkStarted}
              />
            ))
          )}
        </div>
      )}

      {viewMode === 'calendar' && (
        <Calendar
          todos={todos}
          onEditTodo={handleEdit}
          onDeleteTodo={handleDelete}
          onCreateTodo={handleCreateWithDate}
          isTeamMode={mode === 'team'}
          initialSelectedDate={calendarSelectedDate}
        />
      )}

      {viewMode === 'teams' && (
        <TeamsView />
      )}

      {showForm && (
        <TodoForm
          todo={editingTodo}
          defaultDate={defaultDate}
          teamId={mode === 'team' ? selectedTeamId : null}
          isTeamMode={mode === 'team'}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
