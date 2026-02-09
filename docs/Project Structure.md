# Project Structure 

## The Big Picture

```
Sleekflow-To-Do-list/
├── frontend/          # Everything the user sees and interacts with
├── backend/           # The server that powers everything
├── docs/              # Documentation (you are here!)
└── package.json       # The main control center
```

---

## Frontend (`/frontend`)

This is where all the magic happens visually. Built with React and TypeScript.

### Main Structure

```
frontend/
├── src/
│   ├── pages/              # The main screens
│   │   ├── Login.tsx       # Login page with email/password
│   │   ├── Main.tsx        # The heart of the app - switches between personal/team
│   │   ├── Login.css       # Makes the login page beautiful
│   │   └── Main.css        # Styles for the main interface
│   │
│   ├── components/         # Reusable pieces that make up the pages
│   │   ├── TodoList.tsx    # Shows all your todos (list/calendar/teams view)
│   │   ├── TodoItem.tsx    # A single todo card with all its features
│   │   ├── TodoForm.tsx    # Create or edit a todo
│   │   ├── TeamsView.tsx   # Manage your teams and invite people
│   │   ├── TaskProgressModal.tsx  # Detailed work progress popup
│   │   │
│   │   └── calendar/       # Calendar-specific components
│   │       ├── Calendar.tsx      # The calendar grid and sidebar
│   │       └── Calendar.css      # Calendar styling
│   │
│   ├── config/            # Setup files
│   │   └── supabase.ts    # Connection to database
│   │
│   ├── types/             # TypeScript definitions (keeps code organized)
│   │   └── database.types.ts  # All the data shapes (Todo, Team, etc.)
│   │
│   ├── utils/             # Helper functions
│   │   └── api.ts         # Makes talking to the backend easier
│   │
│   ├── App.tsx            # Routes and main app wrapper
│   ├── App.css            # Global styles
│   └── main.tsx           # Entry point (starts everything)
│
├── public/                # Static files
│   └── logo.png           # Your app icon
│
├── index.html             # The HTML shell
├── vite.config.ts         # Vite configuration (dev server settings)
└── package.json           # Frontend dependencies
```

### What Each Component Does

**Pages:**
- `Login.tsx` - Your welcome mat. Handles sign in, sign up, and password reset
- `Main.tsx` - The command center. Has the mode toggle (TODO/TeamDO), notifications, sign out

**Components:**
- `TodoList.tsx` - The master controller that:
  - Fetches todos from the server
  - Switches between list/calendar/teams views
  - Handles filtering and sorting
  - Manages team selection
  
- `TodoItem.tsx` - Each todo card showing:
  - Task name, description, due date
  - Status (Not Started/In Progress/Completed)
  - Quick actions (Work button, status dropdown, date picker)
  - Work progress bars showing who worked and for how long
  - Owner badge for team tasks
  
- `TodoForm.tsx` - The form that pops up when creating or editing todos

- `TeamsView.tsx` - Team management where you can:
  - Create new teams
  - Invite members by email
  - See team members
  - View team stats
  
- `Calendar.tsx` - Beautiful calendar showing:
  - Tasks on their due dates
  - Task progress cards
  - Day details sidebar
  - Work activity timeline (who started working when)

**Utils:**
- `api.ts` - Makes API calls simple. Automatically adds auth tokens to requests

**Types:**
- `database.types.ts` - Defines the structure of:
  - Todo (id, name, description, status, due_date, team_id, etc.)
  - Team (id, name, owner_id, max_members)
  - TeamMember, TeamInvitation, WorkSession

---

## ⚙️ Backend (`/backend`)

The engine room. Handles all the data and business logic.

### Main Structure

```
backend/
├── src/
│   ├── routes/              # API endpoints (the URLs frontend calls)
│   │   ├── auth.ts          # Login, signup, logout
│   │   ├── todos.ts         # CRUD operations for todos
│   │   ├── teams.ts         # Team management
│   │   ├── invitations.ts   # Handle team invitations
│   │   └── workSessions.ts  # Track work time
│   │
│   ├── middleware/          # Request processors
│   │   └── auth.ts          # Checks if user is logged in
│   │
│   ├── config/              # Setup
│   │   └── supabase.ts      # Database connection
│   │
│   └── index.ts             # Server startup and route registration
│
├── package.json             # Backend dependencies
└── tsconfig.json            # TypeScript settings
```

### API Endpoints Explained

**Auth Routes (`/api/auth`)**
- `POST /signup` - Create a new account
- `POST /login` - Sign in with email/password
- `POST /logout` - Sign out
- `GET /session` - Check if you're logged in

**Todo Routes (`/api/todos`)**
- `GET /` - Get all your todos (filtered by user/team)
- `POST /` - Create a new todo
- `PUT /:id` - Update a todo (any team member can update)
- `DELETE /:id` - Delete a todo

**Team Routes (`/api/teams`)**
- `GET /` - Get all teams you're in
- `POST /` - Create a new team (and send invites)
- `GET /:teamId/members` - Get team members

**Invitation Routes (`/api/invitations`)**
- `GET /` - Get your pending invitations
- `POST /:id/accept` - Accept an invitation
- `POST /:id/decline` - Decline an invitation

**Work Session Routes (`/api/work-sessions`)**
- `GET /todo/:todoId` - Get all work sessions for a task
- `POST /start` - Start working on a task
- `POST /stop/:sessionId` - Stop working

**Middleware:**
- `authMiddleware` - Runs before protected routes to verify the user is logged in

---

## Database (Supabase/PostgreSQL)

### Tables

**users** (managed by Supabase Auth)
- `id` - Unique user ID
- `email` - User's email
- `password` - Encrypted

**todos**
- `id` - Unique todo ID
- `user_id` - Who created it (owner)
- `team_id` - Which team it belongs to (null for personal)
- `name` - Task name
- `description` - Details
- `status` - NOT_STARTED, IN_PROGRESS, COMPLETED
- `due_date` - When it's due
- `estimated_hours` - For tracking
- `created_at`, `updated_at` - Timestamps

**teams**
- `id` - Team ID
- `name` - Team name
- `owner_id` - Who created the team
- `max_members` - Capacity limit
- `created_at` - When it was created

**team_members**
- `id` - Membership ID
- `team_id` - Which team
- `user_id` - Which user
- `role` - 'owner' or 'member'
- `joined_at` - When they joined

**team_invitations**
- `id` - Invitation ID
- `team_id` - Which team
- `invited_email` - Who's invited
- `invited_by` - Who sent it
- `status` - 'pending', 'accepted', 'declined'
- `created_at` - When it was sent

**work_sessions**
- `id` - Session ID
- `todo_id` - Which task
- `user_id` - Who's working
- `started_at` - When they started
- `ended_at` - When they stopped (null if still working)
- `duration_minutes` - How long they worked

### Database Functions (Helpers)

- `get_user_email_by_id` - Look up email from user ID
- `get_user_id_by_email` - Look up user ID from email

---

## How Data Flows

1. **User clicks "New TODO"** 
   → `TodoList.tsx` shows `TodoForm.tsx`

2. **User fills form and clicks Save**
   → `TodoForm.tsx` calls `onSave()`
   → Sends data to backend via `api.post('/api/todos')`

3. **Backend receives request**
   → `authMiddleware` checks if user is logged in
   → `POST /api/todos` in `todos.ts` runs
   → Inserts into `todos` table
   → Returns the new todo

4. **Frontend receives response**
   → `TodoList.tsx` adds it to the list
   → Form closes
   → List updates instantly (optimistic update!)

---

## Recent Bug Fixes (Feb 9, 2026)

### Critical Issues Resolved - Blank Pages & Layout Problems

**Issue 1: Duplicate HTML Structure in index.html**
- **Problem**: The entire `<head>` and `<body>` sections were duplicated after the closing `</html>` tag
- **Impact**: Invalid HTML structure causing blank pages and rendering failures
- **Fix**: Removed duplicate lines 15-27 from `frontend/index.html`
- **Result**: Clean, valid HTML5 structure

**Issue 2: Massive CSS Duplication in TodoList.css**
- **Problem**: 350+ lines of CSS duplicated (lines 354-702 were exact copies)
- **Impact**: CSS conflicts, extended page height, performance degradation
- **Affected Styles**: 
  - `.todo-header`, `.view-toggle`, `.toggle-btn`
  - `.btn-create`, `.team-selector-refined`
  - `.filter-select`, `.sort-select`, `.btn-sort-order`
  - All team-mode variants
- **Fix**: Removed duplicate CSS blocks from `frontend/src/components/TodoList.css`
- **Result**: Clean, maintainable CSS with ~50% reduction in file size

**Issue 3: Missing min-height on Main Container**
- **Problem**: `.main-container` lacked minimum height specification
- **Impact**: Potential blank pages when content is minimal
- **Fix**: Added `min-height: 100vh` to `.main-container` in `frontend/src/pages/Main.css`
- **Result**: Consistent full-viewport layout regardless of content

### Files Modified
- `frontend/index.html` - Fixed HTML structure
- `frontend/src/components/TodoList.css` - Removed CSS duplication
- `frontend/src/pages/Main.css` - Added viewport height

### Testing Recommendations
1. Test all pages load correctly (Login, Signup, Main)
2. Verify no layout shifts or blank pages
3. Check both Personal and Team modes
4. Validate responsive behavior on different screen sizes
5. Confirm no console errors in browser DevTools