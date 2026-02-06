# TODO CRUD System

## Overview
Complete TODO management system with Create, Read, Update, and Delete operations. Features filtering, sorting, and a modern UI with glassmorphism design.

---

## Database Schema

### Tables Created in Supabase

#### 1. **todos**
```sql
id              uuid (primary key)
name            varchar(255) not null
description     text not null
due_date        timestamp with time zone not null
status          varchar(50) default 'NOT_STARTED'
team_id         uuid (references teams.id)
created_at      timestamp with time zone default now()
updated_at      timestamp with time zone default now()
```

**Status Values:**
- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`

#### 2. **teams**
```sql
id              uuid (primary key)
name            varchar(255) not null
description     text
created_at      timestamp with time zone default now()
updated_at      timestamp with time zone default now()
```

#### 3. **team_members**
```sql
id              uuid (primary key)
team_id         uuid not null (references teams.id)
user_id         varchar(255) not null
role            varchar(50) default 'member'
joined_at       timestamp with time zone default now()
```

**Role Values:**
- `owner`
- `member`

---

## Backend API

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. **GET /todos**
Get all TODOs with optional filtering and sorting.

**Query Parameters:**
- `status` - Filter by status (NOT_STARTED, IN_PROGRESS, COMPLETED)
- `due_date_from` - Filter by due date (from)
- `due_date_to` - Filter by due date (to)
- `sort_by` - Sort column (due_date, status, name, created_at) [default: created_at]
- `sort_order` - Sort order (asc, desc) [default: desc]

**Example Request:**
```
GET /api/todos?status=IN_PROGRESS&sort_by=due_date&sort_order=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Complete project",
      "description": "Finish the TODO app",
      "due_date": "2026-02-10T12:00:00Z",
      "status": "IN_PROGRESS",
      "team_id": null,
      "created_at": "2026-02-05T10:00:00Z",
      "updated_at": "2026-02-05T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### 2. **GET /todos/:id**
Get a single TODO by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Complete project",
    "description": "Finish the TODO app",
    "due_date": "2026-02-10T12:00:00Z",
    "status": "IN_PROGRESS",
    "team_id": null,
    "created_at": "2026-02-05T10:00:00Z",
    "updated_at": "2026-02-05T10:00:00Z"
  }
}
```

#### 3. **POST /todos**
Create a new TODO.

**Request Body:**
```json
{
  "name": "Complete project",
  "description": "Finish the TODO app",
  "due_date": "2026-02-10T12:00:00Z",
  "status": "NOT_STARTED",
  "team_id": null
}
```

**Required Fields:**
- `name` (string)
- `description` (string)
- `due_date` (ISO 8601 timestamp)

**Optional Fields:**
- `status` (default: NOT_STARTED)
- `team_id` (for team-based TODOs)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Complete project",
    "description": "Finish the TODO app",
    "due_date": "2026-02-10T12:00:00Z",
    "status": "NOT_STARTED",
    "team_id": null,
    "created_at": "2026-02-05T10:00:00Z",
    "updated_at": "2026-02-05T10:00:00Z"
  }
}
```

#### 4. **PUT /todos/:id**
Update an existing TODO.

**Request Body:**
```json
{
  "name": "Updated name",
  "status": "IN_PROGRESS"
}
```

**All fields are optional** - only include fields you want to update.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated name",
    "description": "Finish the TODO app",
    "due_date": "2026-02-10T12:00:00Z",
    "status": "IN_PROGRESS",
    "team_id": null,
    "created_at": "2026-02-05T10:00:00Z",
    "updated_at": "2026-02-05T11:00:00Z"
  }
}
```

#### 5. **DELETE /todos/:id**
Delete a TODO.

**Response:**
```json
{
  "success": true,
  "message": "TODO deleted successfully"
}
```

---

## Frontend Components

### 1. TodoList Component
**Location:** `frontend/src/components/TodoList.tsx`

**Features:**
- Displays all TODOs in a list
- Filter by status (All, Not Started, In Progress, Completed)
- Sort by due date, status, or name
- Toggle sort order (ascending/descending)
- Create new TODO button
- Edit and delete actions

**Props:**
```typescript
interface TodoListProps {
  userId?: string;
}
```

### 2. TodoItem Component
**Location:** `frontend/src/components/TodoItem.tsx`

**Features:**
- Displays individual TODO card
- Status badge with color coding:
  - Not Started: Gray (#94a3b8)
  - In Progress: Blue (#3b82f6)
  - Completed: Green (#10b981)
- Due date display with overdue indicator
- Edit and Delete buttons
- Hover animations

**Props:**
```typescript
interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}
```

### 3. TodoForm Component
**Location:** `frontend/src/components/TodoForm.tsx`

**Features:**
- Modal overlay with glassmorphism
- Create or edit TODO
- Form validation
- Fields:
  - Name (required)
  - Description (required)
  - Due Date (required, datetime-local input)
  - Status (dropdown)
- Error handling
- Loading states

**Props:**
```typescript
interface TodoFormProps {
  todo: Todo | null;  // null for create, Todo object for edit
  onClose: (refresh?: boolean) => void;
}
```

---

## TypeScript Types

**Location:** `frontend/src/types/database.types.ts`

```typescript
export type TodoStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Todo {
  id: string;
  name: string;
  description: string;
  due_date: string;
  status: TodoStatus;
  team_id: string | null;
  created_at: string;
  updated_at: string;
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
```

---

## Design System

### Color Palette
- **Primary:** #000000 (Black)
- **Background:** Linear gradient (#f5f7fa to #c3cfe2)
- **Cards:** rgba(255, 255, 255, 0.95) with glassmorphism
- **Text Primary:** #1e293b
- **Text Secondary:** #475569
- **Text Muted:** #64748b
- **Border:** rgba(0, 0, 0, 0.08)
- **Error:** #ef4444

### Status Colors
- **Not Started:** #94a3b8
- **In Progress:** #3b82f6
- **Completed:** #10b981

### Typography
- **Font Family:** SF Pro Display
- **Headings:** 600-700 weight, -0.5px to -1px letter spacing
- **Body:** 400-500 weight, 1.5-1.6 line height

### Effects
- **Glassmorphism:** backdrop-filter: blur(20px) saturate(180%)
- **Shadows:** 0 4px 12px rgba(0, 0, 0, 0.08)
- **Border Radius:** 8px (buttons), 12px (cards), 16px (modals)
- **Transitions:** cubic-bezier(0.4, 0, 0.2, 1)

---

## Features Implemented

### ✅ CRUD Operations
- Create new TODOs
- Read/List all TODOs
- Update existing TODOs
- Delete TODOs

### ✅ Filtering
- Filter by status
- Filter by due date range (backend ready)

### ✅ Sorting
- Sort by due date
- Sort by status
- Sort by name
- Toggle ascending/descending order

### ✅ UI/UX
- Modern glassmorphism design
- Responsive layout
- Loading states
- Error handling
- Overdue indicators
- Hover animations
- Modal forms with overlay

### ✅ Data Validation
- Required field validation
- Date/time picker
- Status dropdown
- Error messages

---

## Usage Guide

### Creating a TODO
1. Click "+ New TODO" button
2. Fill in the form:
   - Name (required)
   - Description (required)
   - Due Date (required)
   - Status (optional, defaults to "Not Started")
3. Click "Create"

### Editing a TODO
1. Click "Edit" button on any TODO card
2. Modify the fields
3. Click "Update"

### Deleting a TODO
1. Click "Delete" button on any TODO card
2. Confirm deletion in the prompt

### Filtering TODOs
- Use the "Filter by Status" dropdown
- Select: All, Not Started, In Progress, or Completed

### Sorting TODOs
- Use the "Sort by" dropdown
- Choose: Due Date, Status, or Name
- Click the arrow button (↑/↓) to toggle sort order

---

## Database Triggers

### Auto-update timestamps
The database automatically updates the `updated_at` field on every UPDATE operation using triggers.

```sql
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';
```

---

## Future Enhancements

### Potential Features
1. **Teams Integration**
   - Assign TODOs to teams
   - Team-based filtering
   - Role-based permissions

2. **Real-time Updates**
   - Live sync using Supabase subscriptions
   - Collaborative editing

3. **Advanced Filtering**
   - Date range picker UI
   - Multi-status filtering
   - Search by name/description

4. **Drag and Drop**
   - Reorder TODOs
   - Change status via drag

5. **Attachments**
   - File uploads
   - Image previews

6. **Comments**
   - TODO discussions
   - Activity log

7. **Notifications**
   - Due date reminders
   - Email notifications

---

## Testing the API

### Using cURL

**Create TODO:**
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test TODO",
    "description": "Testing the API",
    "due_date": "2026-02-10T12:00:00Z",
    "status": "NOT_STARTED"
  }'
```

**Get all TODOs:**
```bash
curl http://localhost:5000/api/todos
```

**Update TODO:**
```bash
curl -X PUT http://localhost:5000/api/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

**Delete TODO:**
```bash
curl -X DELETE http://localhost:5000/api/todos/{id}
```

---

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript**
- **Supabase** (PostgreSQL)
- **CORS** for cross-origin requests

### Frontend
- **React 18**
- **TypeScript**
- **Vite** (build tool)
- **React Router** (routing)
- **Supabase Client** (auth)

---

## File Structure

```
backend/
├── src/
│   ├── routes/
│   │   └── todos.ts           # TODO CRUD routes
│   ├── config/
│   │   └── supabase.ts        # Supabase client
│   └── index.ts               # Express server

frontend/
├── src/
│   ├── components/
│   │   ├── TodoList.tsx       # Main TODO list
│   │   ├── TodoList.css
│   │   ├── TodoItem.tsx       # Individual TODO card
│   │   ├── TodoItem.css
│   │   ├── TodoForm.tsx       # Create/Edit form
│   │   └── TodoForm.css
│   ├── types/
│   │   └── database.types.ts  # TypeScript definitions
│   └── pages/
│       ├── Home.tsx           # Main dashboard
│       └── Home.css
```

---

**Last Updated:** February 5, 2026
**Version:** 1.0.0


