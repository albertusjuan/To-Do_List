# Project Structure - The Complete Map 🗺️

Let me walk you through how this project is organized. Think of it as a tour of your new codebase!

## The Big Picture

```
Sleekflow-To-Do-list/
├── frontend/          # Everything the user sees and interacts with
├── backend/           # The server that powers everything
├── docs/              # Documentation (you are here!)
└── package.json       # The main control center
```

---

## 🎨 Frontend (`/frontend`)

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

## 🗄️ Database (Supabase/PostgreSQL)

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

## 🎯 How Data Flows

Let's trace what happens when you create a todo:

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

## 🎨 Styling System

### Colors & Themes

**Personal Mode (Light)**
- Primary: Blue (#3b82f6)
- Background: White/Light gray
- Text: Dark

**Team Mode (Dark)**
- Primary: Lighter blue (#60a5fa)
- Background: Dark gradients
- Text: White
- Glassmorphism effects

### Special Effects

- **Glassmorphism** - Frosted glass look with `backdrop-filter: blur()`
- **Smooth transitions** - Everything uses `transition` for butter-smooth animations
- **Gradient backgrounds** - Status-based colors for visual feedback
- **Custom dropdowns** - No default ugly select boxes here!

---

## 🔐 Security Features

1. **Authentication**
   - Every API call requires a valid JWT token
   - Tokens automatically attached by `api.ts`
   - Backend validates on every request

2. **Authorization**
   - Users can only see their own personal todos
   - Team todos visible only to team members
   - Only task owner can mark team tasks as completed

3. **Row Level Security (RLS)**
   - Database enforces access rules
   - Even if API is bypassed, database blocks unauthorized access

---

## 🚀 Key Features Locations

Want to find something specific? Here's where to look:

**Mode Toggle (TODO/TeamDO)**
- Component: `Main.tsx` (lines with `mode-toggle-container`)
- Styles: `Main.css` (`.mode-toggle-container`)

**Work Button**
- Component: `TodoItem.tsx` (search for `btn-work`)
- Logic: `handleWorkButton()` function

**Calendar Work Activity**
- Component: `Calendar.tsx` (search for `work-activity-section`)
- Styles: `Calendar.css` (`.work-activity-section`)

**Notifications**
- Component: `Main.tsx` (search for `notifications-panel`)
- Styles: `Main.css` (`.notifications-panel`)

**Team Creation**
- Component: `TeamsView.tsx` (search for `create-team-form`)
- Backend: `backend/src/routes/teams.ts` POST endpoint

---

## 📦 Dependencies Worth Knowing

**Frontend:**
- `react-router-dom` - Page navigation
- `@supabase/supabase-js` - Database client

**Backend:**
- `express` - Web server
- `cors` - Allow frontend to call backend
- `dotenv` - Environment variables
- `@supabase/supabase-js` - Database client

---

## 🔄 Development Workflow

1. Frontend runs on `http://localhost:5173` (Vite dev server)
2. Backend runs on `http://localhost:5000` (Express server)
3. Frontend proxies `/api/*` requests to backend (configured in `vite.config.ts`)
4. Both watch for changes and auto-reload
5. TypeScript compiles on the fly

---

That's the complete tour! Now you know where everything lives and how it all connects. Happy coding! 🎉

