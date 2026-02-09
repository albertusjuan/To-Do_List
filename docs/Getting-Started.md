# Getting Started Guide 🚀

Welcome! You've downloaded the code, and now you're ready to get it running on your machine. This guide will walk you through every step - from installing dependencies to seeing the app in your browser.

**Estimated time:** 15-20 minutes

---

## 📋 Quick Checklist

Here's what we'll do:

- [ ] **Step 1:** Open the project folder
- [ ] **Step 2:** Install all dependencies
- [ ] **Step 3:** Set up Supabase database
- [ ] **Step 4:** Configure environment variables
- [ ] **Step 5:** Launch the app
- [ ] **Step 6:** Create your first account

Let's get started! 👇

---

## Prerequisites

Before you begin, make sure you have these installed on your computer:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
  - To check: Open terminal and run `node --version`
- **npm** (comes automatically with Node.js)
  - To check: Run `npm --version`
- A code editor (we recommend [VS Code](https://code.visualstudio.com/))
- A free **Supabase account** - [Sign up here](https://supabase.com/)

---

## Step 1: Open the Project 📁

You've already downloaded the code! Now let's navigate to it:

**On Windows:**
```bash
cd "C:\Users\YourName\Downloads\Sleekflow-To-Do-list"
```

**On Mac/Linux:**
```bash
cd ~/Downloads/Sleekflow-To-Do-list
```

💡 **Tip:** You can also drag and drop the folder into your terminal to get the path automatically!

---

## Step 2: Install All Dependencies 📦

This project has two parts: a **frontend** (what you see) and a **backend** (the server). We need to install packages for both.

Run this single command - it installs everything:

```bash
npm run install:all
```

You'll see something like:
```
Installing dependencies for root...
Installing dependencies for frontend...
Installing dependencies for backend...
```

⏱️ This takes 2-3 minutes. Perfect time for a coffee break! ☕

---

## Step 3: Set Up Your Database (Supabase) 🗄️

We'll use Supabase as our database (it's free and really powerful!).

### 3A. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in (or create an account)
2. Click the **"New Project"** button
3. Fill in the details:
   - **Name:** `todo-app` (or whatever you like)
   - **Database Password:** Create a strong password and **save it somewhere safe!** 🔒
   - **Region:** Choose the one closest to you (for better speed)
4. Click **"Create new project"**
5. ⏱️ Wait 2-3 minutes while Supabase provisions your database

☕ Great time for another coffee break!

### 3B. Get Your API Keys

Once your project shows "Project is ready":

1. Look at the left sidebar
2. Click **"Settings"** (the gear icon ⚙️ at the bottom)
3. Click **"API"** in the settings menu
4. You'll see a section called **"Project API keys"**

📝 **Copy these three things** (you'll need them soon):

- **Project URL:** Something like `https://abcdefgh.supabase.co`
- **anon public key:** A long string starting with `eyJhbGc...`
- **service_role key:** Another long string (click "Reveal" to see it)

💡 **Tip:** Keep this tab open - you'll need to copy-paste these in Step 4!

### 3C. Create Your Database Tables

Now we'll create all the tables our app needs.

1. In Supabase, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. **Copy the entire SQL script below** and paste it into the editor:

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

4. Click the **"Run"** button (or press `Ctrl+Enter` on Windows, `Cmd+Return` on Mac)

5. ✅ **You should see:** "Success. No rows returned"
   - This is perfect! It means all tables were created successfully.

6. **Verify it worked:**
   - Click **"Table Editor"** in the left sidebar
   - You should now see these tables: `todos`, `teams`, `team_members`, `team_invitations`, `work_sessions`
   - If you see them, you're all set! 🎉

❌ **If you see an error:**
   - Make sure you copied the entire SQL script (scroll to the top and bottom)
   - Try running it again
   - Check that your project is fully initialized (sometimes it takes a few extra seconds)

---

## Step 4: Configure Environment Variables 🔐

Now we need to tell the app how to connect to your Supabase database. We do this with environment variables.

### Create Backend .env File

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create a `.env` file:
   - **On Windows:** Right-click in the backend folder → New → Text Document → Name it `.env` (delete .txt extension)
   - **On Mac/Linux:** Run `touch .env`
   - **Or:** Just create it in VS Code

3. Open `backend/.env` and add:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxxx...your-anon-key-here
   SUPABASE_SERVICE_KEY=eyJxxxx...your-service-role-key-here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. Go back to the project root:
   ```bash
   cd ..
   ```

### Create Frontend .env File

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Create a `.env` file (same method as above)

3. Open `frontend/.env` and add:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxx...your-anon-key-here
   ```

4. Go back to the project root:
   ```bash
   cd ..
   ```

### Replace with Your Actual Keys

For **both** files, replace:
- `https://xxxxx.supabase.co` → Your **Project URL** from Supabase
- `eyJxxxx...your-anon-key-here` → Your **anon public** key from Supabase
- `eyJxxxx...your-service-role-key-here` → Your **service_role** key from Supabase (backend only)

**Where to find the service_role key:**
1. Go to your Supabase project
2. Click **Settings** → **API**
3. Scroll down to **Project API keys**
4. Copy the **service_role** key (⚠️ this is secret - never share it!)

⚠️ **Important:** These files contain secrets! Never commit them to git or share them publicly. (They're already in `.gitignore`)

---

## Step 5: Launch the App! 🚀

You're ready! Let's start both the frontend and backend servers.

### From the Project Root, Run:

```bash
npm run dev
```

### What You Should See:

```
> dev
> concurrently "npm run dev:frontend" "npm run dev:backend"

[1] 
[1] > backend@1.0.0 dev
[1] > nodemon src/index.ts
[1] 
[0] 
[0] > frontend@0.0.0 dev
[0] > vite
[0] 
[0]   VITE v5.x.x  ready in 500 ms
[0] 
[0]   ➜  Local:   http://localhost:5173/
[0]   ➜  Network: use --host to expose
[1] 
[1] Server is running on http://localhost:5000
```

✅ **Success!** Both servers are running:
- **Frontend:** http://localhost:5173 (the website)
- **Backend:** http://localhost:5000 (the API server)

💡 **Keep this terminal window open** - this needs to stay running while you use the app.

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

## 🔧 Troubleshooting Common Issues

### ❌ "Cannot find module" or "Module not found" errors

**Problem:** Dependencies weren't installed correctly.

**Solution:**
```bash
# Delete all node_modules folders
rm -rf node_modules frontend/node_modules backend/node_modules

# Delete all package-lock files
rm -rf package-lock.json frontend/package-lock.json backend/package-lock.json

# Reinstall everything
npm run install:all
```

---

### ❌ "Port 5173 (or 5000) already in use"

**Problem:** Another app is using that port.

**Quick Fix - Stop the other process:**

**On Windows:**
```bash
# Find what's using port 5173
netstat -ano | findstr :5173

# Kill it (replace PID with the number from above)
taskkill /PID <PID> /F
```

**On Mac/Linux:**
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or for port 5000
lsof -ti:5000 | xargs kill -9
```

**Alternative - Change the port:**
- Frontend: Edit `frontend/vite.config.ts` and change `port: 5173` to another number
- Backend: Edit `backend/.env` and change `PORT=5000` to another number

---

### ❌ "Failed to fetch todos" or Network errors

**Possible causes:**

1. **Backend not running**
   - Check your terminal - do you see "Server is running on http://localhost:5000"?
   - If not, make sure you ran `npm run dev` from the project root

2. **Wrong Supabase credentials**
   - Double-check `frontend/.env` and `backend/.env`
   - Make sure the URLs and keys match exactly what's in Supabase
   - No extra spaces or quotes!

3. **Database tables not created**
   - Go back to Step 3 and run the SQL script in Supabase
   - Check Supabase → Table Editor → you should see `todos`, `teams`, etc.

4. **CORS issues**
   - Make sure `backend/src/index.ts` has CORS enabled (it should by default)

---

### ❌ "Signup failed" or "Authentication error"

**Solutions:**

1. **Enable email auth in Supabase:**
   - Go to Supabase Dashboard
   - Click **Authentication** → **Providers**
   - Make sure **Email** is toggled ON
   - Disable "Confirm email" if you want faster testing

2. **Database tables missing:**
   - Make sure you ran the full SQL script from Step 3
   - Check that all RLS policies were created

3. **Email already exists:**
   - Try signing in instead of signing up
   - Or use a different email address

---

### ❌ Can't see team todos or invitations

**Check these:**

1. **Are you in team mode?**
   - Click the button at the top - it should say **"TeamDO."** (not "TODO.")

2. **Did you accept the invitation?**
   - Check the notifications bell (top right)
   - Click "Accept" on any pending invitations

3. **Check database:**
   - Go to Supabase → Table Editor
   - Look at `team_members` table
   - You should see a row with your `user_id` and the `team_id`

4. **Try refreshing:**
   - Sometimes the app needs a refresh after accepting invitations
   - Press `Ctrl+R` (or `Cmd+R` on Mac)

---

### ❌ "Work" button not working or progress not showing

**Solutions:**

1. **Make sure you're in team mode** - Work tracking is mainly for team tasks

2. **Check work_sessions table:**
   - Go to Supabase → Table Editor → `work_sessions`
   - Should see entries when you start working

3. **Backend might have crashed:**
   - Check the terminal for error messages
   - Try stopping (`Ctrl+C`) and restarting (`npm run dev`)

---

### ❌ Calendar not loading or showing wrong data

**Try these:**

1. **Hard refresh the page:**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear browser cache:**
   - Chrome/Edge: `Ctrl + Shift + Delete`
   - Select "Cached images and files" and clear

3. **Check console for errors:**
   - Press `F12` to open DevTools
   - Click **Console** tab
   - Look for red error messages

---

### ❌ Still Stuck?

**Here's what to check:**

1. **Browser Console (F12):**
   - Press F12 in your browser
   - Look at the Console tab
   - Red errors? Google them or check Supabase logs

2. **Terminal Output:**
   - Look at where you ran `npm run dev`
   - Any error messages? They usually point to the problem

3. **Supabase Logs:**
   - Go to Supabase Dashboard
   - Click **Logs** in the sidebar
   - Check for recent errors

4. **Environment Variables:**
   - Print them to verify (add `console.log()` in code)
   - Make sure no typos or extra spaces

5. **Start Fresh:**
   ```bash
   # Stop the app (Ctrl+C)
   # Clear everything
   rm -rf node_modules frontend/node_modules backend/node_modules
   # Reinstall
   npm run install:all
   # Restart
   npm run dev
   ```

---

## 📚 What to Do Next

Now that everything is running, here's how to make the most of it:

### 1. Explore the Features (15 minutes)

**Personal Todos:**
- Create a few personal tasks
- Set different due dates
- Try changing their status (Not Started → In Progress → Completed)
- Switch to calendar view to see them visually

**Team Collaboration:**
- Click "TODO." to switch to "TeamDO."
- Go to "Teams" view and create a team
- Invite a friend (or use a second email account)
- Create team tasks and watch them sync
- Try the "Work" button to track who's working on what

**Calendar Features:**
- Click on different dates
- See the sidebar update with day details
- Click on task cards to see full progress modal
- Watch work sessions appear in real-time

### 2. Understand the Code (30 minutes)

- **Read** `docs/Project-Structure.md` - Understand how files are organized
- **Explore** the `frontend/src` folder - See how React components work
- **Check out** `backend/src/routes` - See how the API works
- **Look at** the Supabase database structure

### 3. Make It Your Own

Want to customize? Try these:

**Change Colors:**
- Edit `frontend/src/index.css` for global styles
- Edit component CSS files for specific components
- Search for color values (like `#007bff`) and replace them

**Add Features:**
- Add task priorities (high, medium, low)
- Add file attachments
- Add comments on tasks
- Add task templates

**Improve UI:**
- Change fonts
- Add animations
- Redesign the calendar
- Add dark mode

---

## 🛑 Stopping the App

When you're done working:

1. Go to the terminal where `npm run dev` is running
2. Press `Ctrl + C` (or `Cmd + C` on Mac)
3. Type `Y` if asked to terminate

Your data is safe in Supabase - you can start the app again anytime with `npm run dev`!

---

## 🔄 Daily Development Workflow

Once you're set up, here's your daily routine:

```bash
# 1. Navigate to project
cd path/to/Sleekflow-To-Do-list

# 2. Pull latest changes (if working with a team)
git pull

# 3. Install any new dependencies
npm run install:all

# 4. Start the app
npm run dev

# 5. Open browser to http://localhost:5173

# 6. Start coding! 💻

# 7. When done, Ctrl+C to stop
```

---

## 📖 Additional Resources

- **Project Structure:** See `docs/Project-Structure.md`
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **TypeScript Docs:** https://www.typescriptlang.org/docs
- **Express Docs:** https://expressjs.com

---

## 🎉 Congratulations!

You've successfully set up and launched the Sleekflow To-Do app locally! 🚀

You now have:
- ✅ A working full-stack application
- ✅ A React frontend running on port 5173
- ✅ An Express backend running on port 5000
- ✅ A Supabase database with all tables and policies
- ✅ Authentication working
- ✅ Real-time team collaboration ready

**You're ready to build something amazing!** 

Happy coding! 💻✨

---

## 🌐 Want to Deploy This?

Running it locally is great for development, but if you want to share it with others, you'll need to deploy it.

### Quick Deployment Options:

**Frontend (React):**
- **Vercel** (recommended, free): https://vercel.com
- **Netlify** (also great, free): https://netlify.com
- **GitHub Pages** (free, but more setup): https://pages.github.com

**Backend (Express):**
- **Render** (recommended, free tier): https://render.com
- **Railway** (easy, free tier): https://railway.app
- **Heroku** ($7/month): https://heroku.com

**Full Guide Coming Soon!** We'll add a detailed deployment guide in `docs/Deployment.md`

### What You'll Need:
1. Your Supabase project (already done! ✅)
2. Environment variables set in your hosting platform
3. Build your frontend: `cd frontend && npm run build`
4. Deploy frontend build folder and backend separately

💡 **Pro tip:** Keep using your existing Supabase database - just update the environment variables on your hosting platform!

---

*Need help? Check the troubleshooting section above or create an issue in the GitHub repository.*




