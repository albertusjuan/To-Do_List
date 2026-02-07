// Database types based on Supabase schema

export type TodoStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Todo {
  id: string;
  name: string;
  description: string;
  due_date: string;
  status: TodoStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoInput {
  name: string;
  description: string;
  due_date: string;
  status?: TodoStatus;
}

export interface UpdateTodoInput {
  name?: string;
  description?: string;
  due_date?: string;
  status?: TodoStatus;
}


