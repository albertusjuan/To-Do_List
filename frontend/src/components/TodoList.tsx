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

  // Reset to list view when switching from team to personal mode
  useEffect(() => {
    if (mode === 'personal' && viewMode === 'teams') {
      setViewMode('list');
    }
  }, [mode, viewMode]);

  useEffect(() => {
    fetchTodos();
  }, [filterStatus, sortBy, sortOrder, mode]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      let url = `/api/todos?sort_by=${sortBy}&sort_order=${sortOrder}`;
      
      if (filterStatus !== 'ALL') {
        url += `&status=${filterStatus}`;
      }

      const result = await api.get<Todo[]>(url);
      
      if (result.success && result.data) {
        // Filter based on mode: Personal (team_id is null) or Team (team_id is not null)
        const filteredTodos = result.data.filter((todo: Todo) => {
          if (mode === 'personal') {
            return todo.team_id === null;
          } else {
            return todo.team_id !== null;
          }
        });
        setTodos(filteredTodos);
      } else {
        console.error('Error fetching todos:', result.error);
        alert(`Failed to fetch todos: ${result.error}`);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
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
        />
      )}

      {viewMode === 'teams' && (
        <TeamsView />
      )}

      {showForm && (
        <TodoForm
          todo={editingTodo}
          defaultDate={defaultDate}
          teamId={null}
          isTeamMode={mode === 'team'}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
