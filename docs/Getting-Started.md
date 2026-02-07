# Getting Started - Your Complete Setup Guide 🚀

Welcome! This guide will take you from zero to hero in about 10 minutes. Let's get your development environment up and running.

## What You'll Need

Before we start, make sure you have these installed:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A code editor (VS Code is great)
- A free Supabase account - [Sign up here](https://supabase.com/)

---

## Step 1: Get the Code (2 minutes)

If you haven't already, clone or download this project:

```bash
git clone <your-repo-url>
cd Sleekflow-To-Do-list
```

---

## Step 2: Install Dependencies (2 minutes)

This installs everything you need for both frontend and backend:

```bash
npm run install:all
```

Grab a coffee ☕ while npm does its thing. You'll see it installing packages for the root, frontend, and backend.

---

## Step 3: Set Up Your Database (3 minutes)

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click **"New Project"**
3. Give it a name (like "todo-app")
4. Choose a database password (save this!)
5. Pick a region close to you
6. Click **"Create new project"**
7. Wait about 2 minutes while Supabase sets everything up

### Get Your Connection Details

Once your project is ready:

1. Click on **"Settings"** (gear icon) in the sidebar
2. Go to **"API"**
3. You'll see two important things:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

### Set Up Your Database Tables

1. In Supabase, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Copy and paste this SQL (creates all your tables):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  team_id UUID,
  estimated_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work sessions table
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_email_by_id(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT email FROM auth.users WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_email_by_id(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated, anon;

-- Add foreign key for team_id in todos (after teams table exists)
ALTER TABLE todos 
ADD CONSTRAINT todos_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Todos policies
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view team todos"
  ON todos FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create todos"
  ON todos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update todos they can access"
  ON todos FOR UPDATE
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (user_id = auth.uid());

-- Teams policies
CREATE POLICY "Users can view their teams"
  ON teams FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update teams"
  ON teams FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete teams"
  ON teams FOR DELETE
  USING (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Users can view team members of their teams"
  ON team_members FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  );

-- Team invitations policies
CREATE POLICY "Users can view invitations sent to them"
  ON team_invitations FOR SELECT
  USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can view invitations they sent"
  ON team_invitations FOR SELECT
  USING (invited_by = auth.uid());

CREATE POLICY "Team owners can create invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update invitations sent to them"
  ON team_invitations FOR UPDATE
  USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Work sessions policies
CREATE POLICY "Users can view work sessions for accessible todos"
  ON work_sessions FOR SELECT
  USING (
    todo_id IN (
      SELECT id FROM todos WHERE user_id = auth.uid() OR
      team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create work sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own work sessions"
  ON work_sessions FOR UPDATE
  USING (user_id = auth.uid());
```

4. Click **"Run"** (or press Ctrl+Enter)
5. You should see "Success. No rows returned" - that's perfect!

---

## Step 4: Configure Your Environment (1 minute)

Create a file called `.env` in the root of your project (next to `package.json`):

```bash
# In the project root
touch .env
```

Open `.env` and add your Supabase details:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx...your-long-key-here

# Server Configuration
PORT=5000
```

Replace:
- `https://xxxxx.supabase.co` with your Project URL
- `eyJxxxx...` with your anon public key

**Important:** Keep this file private! Never commit it to git (it's already in `.gitignore`).

---

## Step 5: Start the App! (1 minute)

Now for the moment of truth:

```bash
npm run dev
```

You should see:
```
> dev
> concurrently "npm run dev:frontend" "npm run dev:backend"

[0] VITE v5.x.x  ready in xxx ms
[0] ➜  Local:   http://localhost:5173/
[1] Server is running on http://localhost:5000
```

---

## Step 6: Create Your First Account (1 minute)

1. Open your browser and go to `http://localhost:5173`
2. You'll see the login page
3. Click **"Sign Up"**
4. Enter your email and password
5. Click **"Sign Up"**
6. You're in! 🎉

---

## 🎯 Quick Tour

Now that you're in, here's what to try:

### Your First Todo
1. Click **"+ New TODO"**
2. Give it a name and description
3. Pick a due date
4. Click **"Save"**

### Switch to Calendar View
1. Click **"Calendar"** at the top
2. See your todo on its due date
3. Click on a day to see details

### Try Team Mode
1. Click the **"TODO."** button to switch to **"TeamDO."**
2. Click **"Teams"** view
3. Click **"Create New Team"**
4. Give it a name and invite some friends by email
5. Now switch back to **"TeamDO."** list view
6. Create a todo - it's automatically a team todo!

### Start Working
1. In team mode, click **"Work"** on a task
2. The app switches to calendar view
3. See yourself listed as currently working
4. Try it with multiple users to see the magic!

---

## 🔧 Common Issues & Solutions

### "Failed to fetch todos"
- Check that backend is running (look for "Server is running" in terminal)
- Make sure `.env` has correct Supabase credentials
- Try refreshing the page

### "Signup failed"
- Make sure you ran the SQL script in Supabase
- Check Supabase dashboard > Authentication > Providers > Email is enabled
- Try a different email address

### Port already in use
- Something else is using port 5173 or 5000
- Either stop that process or change ports in:
  - `frontend/vite.config.ts` (frontend port)
  - `.env` (backend PORT variable)

### Can't see team todos
- Make sure you accepted the team invitation
- Check Supabase > Table Editor > team_members to verify membership
- Try refreshing the page

---

## 📚 Next Steps

You're all set up! Here's what to explore next:

1. **Read the Project Structure** - Understand how everything is organized
   - Check out `docs/Project-Structure.md`

2. **Try All the Features:**
   - Create personal and team todos
   - Use the calendar view
   - Track work progress
   - Send team invitations
   - Check notifications

3. **Customize It:**
   - Change colors in the CSS files
   - Add new features
   - Make it your own!

---

## 🆘 Still Stuck?

- Check the console in your browser (F12) for error messages
- Look at the terminal output for backend errors
- Review the Supabase logs in the dashboard
- Make sure all environment variables are correct
- Try stopping and restarting `npm run dev`

---

## 🎉 You Did It!

Congratulations! You've successfully set up the Sleekflow To-Do app. Now go forth and be productive! 🚀

Happy coding! 💻✨

