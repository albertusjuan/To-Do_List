# User Guide 

## Quick Checklist

Here's what we'll do:

- [ ] **Step 1:** Open the project folder
- [ ] **Step 2:** Install all dependencies
- [ ] **Step 3:** Configure environment variables (Supabase credentials will be provided)
- [ ] **Step 4:** Launch the app
- [ ] **Step 5:** Create your first account


## Step 1: Open the Project 📁

**On Windows:**
```bash
cd "C:\Users\YourName\Downloads\Sleekflow-To-Do-list"
```

**On Mac/Linux:**
```bash
cd ~/Downloads/Sleekflow-To-Do-list
```

---

## Step 2: Install All Dependencies 

This project has two parts: a **frontend** and a **backend**. We need to install packages for both.

Run this single command:

```bash
npm run install:all
```
---

## Step 3: Configure Environment Variables 

**Important:** The Supabase database credentials will be provided to you. You'll receive:
- Supabase Project URL
- Supabase Anon Key


Now let's set up the environment variables to connect your app to the database.

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

### Replace with the Provided Credentials

For **both** files, replace the placeholder values with the **credentials provided to you**:
- `https://xxxxx.supabase.co` → Your provided **Supabase Project URL**
- `eyJxxxx...your-anon-key-here` → Your provided **Supabase Anon Key**

---

## Step 4: Launch the App! 

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

## Step 5: Create Your First Account

1. Open your browser and go to `http://localhost:5173`
2. You'll see the login page
3. Click **"Sign Up"**
4. Enter your email and password
5. Click **"Sign Up"**
6. You're in! 🎉

---
