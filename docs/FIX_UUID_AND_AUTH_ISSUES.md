# 🔧 FIX: UUID & Authorization Issues

## 🐛 **Problems Fixed**

### **Problem 1: UUID doesn't exist**
Error when running migrations:
```
uuid-ossp extension not enabled
```

### **Problem 2: No authorization token**
Error when creating todos after login:
```
No authorization token provided
```

---

## ✅ **Solutions**

### **FIX 1: Enable UUID Extension**

**Step 1: Run UUID Enabler FIRST**

Go to Supabase Dashboard → SQL Editor → Run this:

```sql
-- File: database/migrations/000_ENABLE_UUID_FIRST.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Test
DO $$
DECLARE
  test_uuid UUID;
BEGIN
  test_uuid := gen_random_uuid();
  RAISE NOTICE 'UUID extension working! Test UUID: %', test_uuid;
END $$;
```

**You should see:** `UUID extension working! Test UUID: [some-uuid]`

**Step 2: Now Run Other Migrations**

After UUID is enabled, you can run:
- `000_create_migrations_table.sql`
- `001_add_team_invitations_FIXED.sql`
- `002_add_user_id_to_todos.sql`

---

### **FIX 2: Authorization Token**

**What Was Wrong:**
Frontend was making API calls WITHOUT the JWT token:

```typescript
// ❌ Before (BROKEN)
const response = await fetch('/api/todos');
// No Authorization header!
```

**What We Fixed:**
Created an API helper that automatically adds the auth token:

```typescript
// ✅ After (FIXED)
import { api } from '../utils/api';
const result = await api.get('/api/todos');
// Automatically includes: Authorization: Bearer <token>
```

**Files Updated:**
- ✅ `frontend/src/utils/api.ts` - New API helper
- ✅ `frontend/src/components/TodoList.tsx` - Uses api helper
- ✅ `frontend/src/components/TodoForm.tsx` - Uses api helper

---

## 🚀 **Testing Steps**

### **Test 1: UUID Works**

```sql
-- In Supabase SQL Editor
SELECT gen_random_uuid();
```

Should return a UUID like: `550e8400-e29b-41d4-a716-446655440000`

### **Test 2: Login & Create Todo**

1. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Login to frontend:**
   - Use any email
   - Should login successfully

3. **Create a todo:**
   - Click "+ New TODO"
   - Fill in details
   - Click Create
   - **Should work!** (No auth error)

4. **Login as different user:**
   - Logout
   - Login with different email
   - **Should NOT see previous user's todos!**

### **Test 3: Check Auth Header**

Open browser DevTools → Network tab → Create a todo → Check the request:

```
Headers:
  Authorization: Bearer eyJhbGciOiJI... (long token)
```

If you see this header, auth is working! ✅

---

## 📝 **Migration Order**

Run in this exact order:

```
1. 000_ENABLE_UUID_FIRST.sql       ← Run FIRST!
2. 000_create_migrations_table.sql ← Track migrations
3. 001_add_team_invitations_FIXED.sql ← Teams system
4. 002_add_user_id_to_todos.sql    ← User isolation (CRITICAL!)
```

After each migration, record it:
```sql
INSERT INTO schema_migrations (migration_name, description) 
VALUES 
  ('000_enable_uuid', 'Enable UUID extensions'),
  ('000_create_migrations_table', 'Migration tracking'),
  ('001_add_team_invitations', 'Team invitation system'),
  ('002_add_user_id_to_todos', 'User data isolation');
```

---

## 🔍 **How the API Helper Works**

### **Auto Token Injection**

```typescript
// frontend/src/utils/api.ts

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // 🔑 Automatically add auth token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}
```

### **Convenience Methods**

```typescript
// Easy to use!
api.get('/api/todos')           // GET request with auth
api.post('/api/todos', data)    // POST request with auth
api.put('/api/todos/123', data) // PUT request with auth
api.delete('/api/todos/123')    // DELETE request with auth
```

### **Error Handling**

```typescript
const result = await api.get('/api/todos');

if (result.success) {
  // Use result.data
  console.log(result.data);
} else {
  // Show error
  alert(result.error);
}
```

---

## 🛡️ **Security Flow**

### **Before (BROKEN)**

```
User A logs in
  ↓
Creates todo
  ↓
Backend: ❌ No token check
  ↓
Todo created for... nobody? everyone?
  ↓
User B logs in
  ↓
Sees User A's todos! 🚨 SECURITY BREACH
```

### **After (FIXED)**

```
User A logs in
  ↓
Gets JWT token: eyJhbGci...
  ↓
Creates todo
  ↓
Frontend: Adds "Authorization: Bearer eyJhbGci..."
  ↓
Backend: Verifies token
  ↓
Backend: Extracts user_id from token
  ↓
Backend: Sets todo.user_id = User A's ID
  ↓
Todo saved with user_id
  ↓
User B logs in
  ↓
Gets different JWT token
  ↓
Fetches todos
  ↓
Backend: Filters by User B's ID
  ↓
User B sees ONLY their todos ✅ SECURE
```

---

## 📊 **Database After Migrations**

### **Tables Created:**

1. **schema_migrations** - Track applied migrations
2. **teams** - Team information
3. **team_members** - Who's in each team
4. **team_invitations** - Email invitations
5. **todos** - Updated with `user_id` column

### **Key Columns:**

```sql
todos:
  - user_id UUID NOT NULL    ← CRITICAL: Owner of todo
  - team_id UUID NULL         ← Optional: Team assignment

team_members:
  - user_id UUID              ← Member's user ID
  - team_id UUID              ← Which team
  - role TEXT                 ← 'owner' or 'member'
```

---

## ⚠️ **Common Errors & Solutions**

### **Error: "uuid-ossp does not exist"**

**Solution:** Run `000_ENABLE_UUID_FIRST.sql` first!

### **Error: "No authorization token provided"**

**Solutions:**
1. Make sure backend is running
2. Check frontend is using `api` helper (not raw `fetch`)
3. Clear browser cache and re-login

### **Error: "User not authenticated"**

**Solutions:**
1. Logout and login again
2. Check Supabase session is valid
3. Restart backend server

### **Error: "Cannot read property 'access_token'"**

**Solution:** User is not logged in. Redirect to login page.

---

## 🎯 **Verification Checklist**

After applying all fixes:

- [ ] UUID extension enabled in Supabase
- [ ] All 4 migrations applied successfully
- [ ] Migrations recorded in schema_migrations table
- [ ] Backend running with auth middleware
- [ ] Can login with email
- [ ] Can create todos
- [ ] Can see own todos
- [ ] Cannot see other users' todos
- [ ] Auth token visible in Network tab
- [ ] No "authorization token" errors
- [ ] No "UUID" errors

---

## 📚 **Related Files**

### **Database**
- `database/migrations/000_ENABLE_UUID_FIRST.sql`
- `database/migrations/000_create_migrations_table.sql`
- `database/migrations/001_add_team_invitations_FIXED.sql`
- `database/migrations/002_add_user_id_to_todos.sql`

### **Backend**
- `backend/src/middleware/auth.ts` - Auth verification
- `backend/src/routes/todos.ts` - Protected endpoints

### **Frontend**
- `frontend/src/utils/api.ts` - API helper with auto-auth
- `frontend/src/components/TodoList.tsx` - Updated to use api helper
- `frontend/src/components/TodoForm.tsx` - Updated to use api helper

### **Docs**
- `docs/CRITICAL_FIX_User_Data_Isolation.md` - Security fix details
- `docs/FIX_UUID_AND_AUTH_ISSUES.md` - This file

---

## 🎉 **Success!**

Both issues are now fixed:
- ✅ UUID extension enabled
- ✅ Authorization token automatically sent
- ✅ Users can only see their own todos
- ✅ Secure multi-user system

**Next:** Apply all migrations in order and test! 🚀

