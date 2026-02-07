// Database types based on Supabase schema

export type TodoStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Todo {
  id: string;
  user_id: string;
  name: string;
  description: string;
  due_date: string;
  status: TodoStatus;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  expires_at: string;
}

export interface CreateTodoInput {
  name: string;
  description: string;
  due_date: string;
  status?: TodoStatus;
  team_id?: string | null;
}

export interface UpdateTodoInput {
  name?: string;
  description?: string;
  due_date?: string;
  status?: TodoStatus;
  team_id?: string | null;
}


