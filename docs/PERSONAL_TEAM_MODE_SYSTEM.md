# 🎯 Personal & Team Mode System Documentation

**Version:** 1.0.0  
**Last Updated:** February 5, 2026  
**Implementation:** Option 1 - Single Page with Mode Toggle

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [File Structure](#file-structure)
4. [How It Works](#how-it-works)
5. [Code Breakdown](#code-breakdown)
6. [Data Flow](#data-flow)
7. [Styling System](#styling-system)
8. [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

### What is Personal & Team Mode?
This system allows users to toggle between two modes:
- **Personal Mode:** Shows only TODOs without a team (`team_id = null`)
- **Team Mode:** Shows only TODOs assigned to teams (`team_id != null`)

### Key Features
✅ Single page application (Main.tsx)  
✅ Toggle switch in header  
✅ Automatic TODO filtering  
✅ Different UI styling per mode  
✅ Maintains all TODO functionality (CRUD, Calendar, List view)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────┐
│           Main.tsx (Entry Point)         │
│  ┌─────────────────────────────────┐   │
│  │  Header with Mode Toggle         │   │
│  │  [Personal] [Team] Sign Out      │   │
│  └─────────────────────────────────┘   │
│                  ↓                       │
│  ┌─────────────────────────────────┐   │
│  │      TodoList Component          │   │
│  │  - Receives mode prop            │   │
│  │  - Filters TODOs by mode         │   │
│  │  - Shows List or Calendar        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

### Renamed Files
```
OLD → NEW
frontend/src/pages/Home.tsx  →  Main.tsx
frontend/src/pages/Home.css  →  Main.css
```

### Key Files & Their Purpose

#### **1. Main.tsx** (Main Dashboard)
**Location:** `frontend/src/pages/Main.tsx`  
**Purpose:** Main entry point after login

**What it does:**
- Manages Personal/Team mode state
- Renders header with mode toggle
- Passes mode to TodoList component
- Handles sign out
- Displays date/time

**Key State:**
```typescript
const [mode, setMode] = useState<ViewMode>('personal');
```

**Mode Toggle:**
```typescript
<div className="mode-toggle">
  <button onClick={() => setMode('personal')}>Personal</button>
  <button onClick={() => setMode('team')}>Team</button>
</div>
```

---

#### **2. Main.css** (Styling)
**Location:** `frontend/src/pages/Main.css`  
**Purpose:** Styles for Main page and mode-specific themes

**Personal Mode (Default):**
```css
.main-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
```

**Team Mode (Darker):**
```css
.main-container.team-mode {
  background: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%);
}
```

**Mode Toggle Button:**
```css
.mode-btn.active {
  background: #000000;
  color: #ffffff;
}
```

---

#### **3. TodoList.tsx** (TODO Container)
**Location:** `frontend/src/components/TodoList.tsx`  
**Purpose:** Fetches, filters, and displays TODOs

**Receives Mode:**
```typescript
interface TodoListProps {
  userId?: string;
  mode: ViewMode;  // ← NEW: Personal or Team
}
```

**Filtering Logic:**
```typescript
const filteredTodos = result.data.filter((todo: Todo) => {
  if (mode === 'personal') {
    return todo.team_id === null;      // Personal TODOs only
  } else {
    return todo.team_id !== null;      // Team TODOs only
  }
});
```

**Re-fetches when mode changes:**
```typescript
useEffect(() => {
  fetchTodos();
}, [filterStatus, sortBy, sortOrder, mode]);  // ← mode added
```

---

#### **4. App.tsx** (Routing)
**Location:** `frontend/src/App.tsx`  
**Purpose:** Application routing

**Updated Import:**
```typescript
import { Main } from './pages/Main';  // ← Changed from Home
```

**Route:**
```typescript
<Route path="/" element={
  <ProtectedRoute>
    <Main />  {/* ← Changed from Home */}
  </ProtectedRoute>
} />
```

---

#### **5. database.types.ts** (Type Definitions)
**Location:** `frontend/src/types/database.types.ts`  
**Purpose:** TypeScript types for database objects

**ViewMode Type:**
```typescript
export type ViewMode = 'personal' | 'team';
```

**Todo Interface:**
```typescript
export interface Todo {
  id: string;
  name: string;
  description: string;
  due_date: string;
  status: TodoStatus;
  team_id: string | null;  // ← KEY: Determines mode
  created_at: string;
  updated_at: string;
}
```

---

## 🔄 How It Works

### 1. User Opens Application
```
Login → Protected Route → Main.tsx
```

### 2. Default State
```typescript
mode = 'personal'  // Default to Personal mode
```

### 3. User Clicks Mode Toggle
```
Click "Team" → setMode('team') → Triggers re-fetch
```

### 4. TodoList Filters Data
```typescript
fetchTodos() called → Filter by team_id → Display filtered results
```

### 5. UI Updates
```css
.main-container adds .team-mode class → Darker background applied
```

---

## 📊 Data Flow

### Personal Mode Flow
```
User → Personal Mode
   ↓
TodoList fetches all TODOs
   ↓
Filter: Keep only TODOs where team_id = null
   ↓
Display Personal TODOs
```

### Team Mode Flow
```
User → Team Mode
   ↓
TodoList fetches all TODOs
   ↓
Filter: Keep only TODOs where team_id != null
   ↓
Display Team TODOs
```

### Creating New TODO
```
Personal Mode:
- Create TODO form → team_id = null

Team Mode:
- Create TODO form → team_id = null (for now)*
```
*Note: Team assignment feature not yet implemented

---

## 🎨 Styling System

### Personal Mode (Default - Bright)
**Background:**
```css
linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)
```

**Components:**
- Navbar: `rgba(255, 255, 255, 0.95)`
- Calendar: `rgba(255, 255, 255, 0.7)`
- Cards: `rgba(255, 255, 255, 0.5)`

### Team Mode (Darker Shade)
**Background:**
```css
linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)
```

**Components:**
- Navbar: `rgba(255, 255, 255, 0.85)` (slightly darker)
- Calendar: `rgba(255, 255, 255, 0.5)` (darker)
- Cards: `rgba(255, 255, 255, 0.3)` (darker)

### CSS Class Structure
```css
.main-container                    /* Base container */
.main-container.personal-mode      /* Personal styling (default) */
.main-container.team-mode          /* Team styling override */
```

---

## 🔑 Key Components Breakdown

### Main.tsx Components

#### **1. Mode State**
```typescript
const [mode, setMode] = useState<ViewMode>('personal');
```
**Purpose:** Tracks current mode  
**Default:** Personal  
**Changes:** Via toggle button

#### **2. Container Class**
```typescript
<div className={`main-container ${mode === 'team' ? 'team-mode' : 'personal-mode'}`}>
```
**Purpose:** Applies conditional styling  
**Personal:** `.personal-mode` class  
**Team:** `.team-mode` class

#### **3. Mode Toggle UI**
```typescript
<div className="mode-toggle">
  <button 
    className={`mode-btn ${mode === 'personal' ? 'active' : ''}`}
    onClick={() => setMode('personal')}
  >
    Personal
  </button>
  <button 
    className={`mode-btn ${mode === 'team' ? 'active' : ''}`}
    onClick={() => setMode('team')}
  >
    Team
  </button>
</div>
```
**Purpose:** User interface to switch modes  
**Active State:** Black background with white text  
**Inactive State:** Gray text with transparent background

#### **4. TodoList Integration**
```typescript
<TodoList userId={user?.id} mode={mode} />
```
**Purpose:** Passes current mode to TodoList  
**Result:** TodoList filters TODOs accordingly

---

## 💾 Database Schema Reference

### todos Table
```sql
CREATE TABLE todos (
    id uuid PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text NOT NULL,
    due_date timestamp NOT NULL,
    status varchar(50) NOT NULL,
    team_id uuid REFERENCES teams(id),  ← NULL for personal, ID for team
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

### Filtering Rules
```sql
-- Personal TODOs
SELECT * FROM todos WHERE team_id IS NULL;

-- Team TODOs  
SELECT * FROM todos WHERE team_id IS NOT NULL;
```

---

## 🚀 API Integration

### Endpoint
```
GET /api/todos?sort_by=due_date&sort_order=asc
```

### Backend Returns
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "team_id": null,        ← Personal TODO
      ...
    },
    {
      "id": "uuid-2",
      "team_id": "team-123",  ← Team TODO
      ...
    }
  ]
}
```

### Frontend Filters
```typescript
const filteredTodos = result.data.filter((todo: Todo) => {
  if (mode === 'personal') {
    return todo.team_id === null;      // Show only nulls
  } else {
    return todo.team_id !== null;      // Show only non-nulls
  }
});
```

---

## 🔍 Component Relationships

```
App.tsx
  └── AuthProvider
       └── ProtectedRoute
            └── Main.tsx
                 ├── Navbar (with mode toggle)
                 └── TodoList (receives mode prop)
                      ├── TodoItem (list view)
                      ├── TodoForm (create/edit)
                      └── Calendar (calendar view)
                           └── Sidebar (shows TODOs for date)
```

---

## 📝 Example User Flows

### Flow 1: Create Personal TODO
```
1. User in Personal Mode
2. Click "+ New TODO"
3. Fill form (team_id automatically null)
4. Save
5. TODO appears in Personal Mode only
```

### Flow 2: Switch to Team Mode
```
1. User viewing Personal TODOs
2. Click "Team" button in header
3. UI darkens (team-mode styling)
4. TodoList re-fetches and filters
5. Only Team TODOs displayed
6. Personal TODOs hidden
```

### Flow 3: Calendar View in Team Mode
```
1. User in Team Mode
2. Click "Calendar" toggle
3. Calendar displays
4. Shows only Team TODOs on dates
5. Click date → Sidebar shows Team TODOs for that date
```

---

## 🎨 UI Visual States

### Personal Mode Header
```
┌──────────────────────────────────────────┐
│ TODO.  Date/Time  [Personal▪] [Team]  Sign Out │
│                    ^active                │
└──────────────────────────────────────────┘
Background: Bright gradient (f5f7fa → c3cfe2)
```

### Team Mode Header
```
┌──────────────────────────────────────────┐
│ TODO.  Date/Time  [Personal] [Team▪]  Sign Out │
│                              ^active      │
└──────────────────────────────────────────┘
Background: Darker gradient (e5e7eb → 9ca3af)
```

---

## ⚙️ Configuration

### Default Mode
**File:** `Main.tsx`  
**Line:** `const [mode, setMode] = useState<ViewMode>('personal');`  
**Change to Team:** Change `'personal'` to `'team'`

### Styling Colors
**File:** `Main.css`

**Personal Mode:**
```css
background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
```

**Team Mode:**
```css
background: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%);
```

---

## 🔮 Future Enhancements

### Planned Features

#### 1. Team Creation & Management
```
- Create team page
- Invite members
- Assign roles (owner/member)
- Team settings
```

#### 2. Team Selector in TODO Form
```
<select name="team">
  <option value="">Personal</option>
  <option value="team-id-1">Marketing Team</option>
  <option value="team-id-2">Dev Team</option>
</select>
```

#### 3. Team Dashboard
```
- Team overview
- Member list
- Team statistics
- Activity feed
```

#### 4. Multi-Team Support
```
- User can be in multiple teams
- Filter by specific team
- Switch between teams
```

#### 5. Team Permissions
```
- Owner: Full access
- Member: Limited access
- Viewer: Read-only
```

---

## 🐛 Known Limitations

### Current Limitations

1. **No Team Creation UI**
   - Teams can only be created via database
   - No team management interface

2. **No Team Assignment in TODO Form**
   - All TODOs created with `team_id = null`
   - Must manually update in database

3. **No Team Display in TODO Cards**
   - Team name not shown
   - No visual indicator which team

4. **No Multi-Team Filtering**
   - Shows ALL team TODOs
   - Can't filter by specific team

---

## 📚 Code Examples

### Example 1: Add Mode to Component
```typescript
// Your component
export function MyComponent({ mode }: { mode: ViewMode }) {
  return (
    <div className={mode === 'team' ? 'team-style' : 'personal-style'}>
      {mode === 'personal' ? 'Personal View' : 'Team View'}
    </div>
  );
}
```

### Example 2: Conditional Styling
```css
/* Personal mode styling */
.my-component {
  background: white;
}

/* Team mode override */
.main-container.team-mode .my-component {
  background: rgba(255, 255, 255, 0.5);
}
```

### Example 3: Filter TODOs by Mode
```typescript
const filteredTodos = todos.filter(todo => {
  return mode === 'personal' 
    ? todo.team_id === null 
    : todo.team_id !== null;
});
```

---

## 🎯 Quick Reference

### Key Variables
```typescript
mode: ViewMode                // Current mode ('personal' | 'team')
team_id: string | null        // null = personal, uuid = team
```

### Key Classes
```css
.main-container               // Base container
.main-container.team-mode     // Team mode styling
.mode-toggle                  // Toggle button container
.mode-btn.active              // Active button
```

### Key Props
```typescript
<TodoList mode={mode} />      // Pass mode to TodoList
```

---

## 📞 Support & Questions

### Common Questions

**Q: How do I create a Team TODO?**  
A: Currently, you must set `team_id` in the database. Team creation UI coming soon.

**Q: Can I see both Personal and Team TODOs?**  
A: No, mode toggle filters exclusively. Use Personal mode for personal, Team mode for team.

**Q: Why is Team mode darker?**  
A: Visual distinction helps users know which mode they're in.

**Q: Where is team data stored?**  
A: `teams` and `team_members` tables in Supabase (not yet used in UI).

---

## 📄 Summary

### What You Have Now
- ✅ Single Main page (renamed from Home)
- ✅ Personal/Team mode toggle in header
- ✅ Automatic TODO filtering by `team_id`
- ✅ Different UI styling per mode
- ✅ All TODO features work in both modes

### What's Not Implemented Yet
- ❌ Team creation UI
- ❌ Team assignment in TODO form
- ❌ Team member management
- ❌ Multi-team support
- ❌ Team-specific features

---

**End of Documentation**  
**For questions, refer to the codebase or this guide.**


