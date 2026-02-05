import { useState, useEffect } from 'react';
import { Todo, TodoStatus } from '../types/database.types';
import { TodoItem } from './TodoItem';
import { TodoForm } from './TodoForm';
import './TodoList.css';

interface TodoListProps {
  userId?: string;
}

export function TodoList({ userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filterStatus, setFilterStatus] = useState<TodoStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'due_date' | 'status' | 'name'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchTodos();
  }, [filterStatus, sortBy, sortOrder]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      let url = `/api/todos?sort_by=${sortBy}&sort_order=${sortOrder}`;
      
      if (filterStatus !== 'ALL') {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setTodos(result.data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTodo(null);
    setShowForm(true);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this TODO?')) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        fetchTodos();
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleFormClose = (refresh?: boolean) => {
    setShowForm(false);
    setEditingTodo(null);
    if (refresh) {
      fetchTodos();
    }
  };

  if (loading) {
    return <div className="todo-loading">Loading todos...</div>;
  }

  return (
    <div className="todo-list-container">
      <div className="todo-header">
        <h2>My TODOs</h2>
        <button onClick={handleCreate} className="btn-create">
          + New TODO
        </button>
      </div>

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
            />
          ))
        )}
      </div>

      {showForm && (
        <TodoForm
          todo={editingTodo}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
