# Database Migrations

## Overview
This folder contains all database schema changes in SQL migration files. Each file represents a single database change that can be applied to keep your schema up-to-date.

---

## 🎯 Why Use Migrations?

1. **Version Control** - All database changes are tracked in Git
2. **No Memory Loss** - Every change is documented and saved
3. **Reproducible** - Same changes can be applied to dev/staging/production
4. **Team Collaboration** - Everyone sees what changed and when
5. **Rollback Possible** - Can create reverse migrations if needed

---

## 📋 Migration Files

Migrations are numbered sequentially:

| File | Description | Status |
|------|-------------|--------|
| `000_create_migrations_table.sql` | Creates tracking table | ⚠️ Run first |
| `001_add_team_invitations.sql` | Team invitation system | 🟡 Pending |

---

## 🚀 How to Apply Migrations

### **Step 1: Set Up Tracking (One Time Only)**

1. Go to Supabase Dashboard → SQL Editor
2. Open `000_create_migrations_table.sql`
3. Copy and paste the entire content
4. Click **Run**
5. Verify the table was created:
   ```sql
   SELECT * FROM schema_migrations;
   ```

### **Step 2: Apply Migration**

For each migration file (in order):

1. Open the migration file (e.g., `001_add_team_invitations.sql`)
2. Go to Supabase Dashboard → SQL Editor
3. Copy and paste the content
4. Click **Run**
5. **Important:** Record that you applied it:
   ```sql
   INSERT INTO schema_migrations (migration_name, description) 
   VALUES ('001_add_team_invitations', 'Team invitation system with max members');
   ```

### **Step 3: Verify**

Check that the migration was applied:
```sql
-- See all applied migrations
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- Check specific tables exist
\dt teams
\dt team_invitations
```

---

## ✅ Best Practices

### **1. Always Create Migration Files for Schema Changes**

**✅ DO:**
- Create new migration file for every change
- Save file in `database/migrations/`
- Commit to Git
- Apply to Supabase

**❌ DON'T:**
- Manually create tables in Supabase UI without saving SQL
- Modify old migration files after they've been applied
- Create schema changes from application code

### **2. Naming Convention**

```
{number}_{descriptive_name}.sql

Examples:
- 000_create_migrations_table.sql
- 001_add_team_invitations.sql
- 002_add_user_profiles.sql
- 003_modify_todos_add_tags.sql
```

### **3. Migration File Structure**

Every migration should include:

```sql
-- Migration: [Name]
-- Date: [YYYY-MM-DD]
-- Description: [What this migration does]

-- [Your SQL commands here]

-- Rollback (commented):
-- [Commands to reverse this migration]
```

### **4. Use Idempotent Commands**

Make migrations safe to run multiple times:

```sql
-- ✅ GOOD: Safe to run multiple times
CREATE TABLE IF NOT EXISTS teams (...);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_members INTEGER;
DROP INDEX IF EXISTS idx_teams_name;

-- ❌ BAD: Will fail if run twice
CREATE TABLE teams (...);
ALTER TABLE teams ADD COLUMN max_members INTEGER;
```

### **5. Never Modify Applied Migrations**

```
❌ BAD:
- Edit 001_add_team_invitations.sql after applying it
- Delete a migration that was already applied

✅ GOOD:
- Create new migration: 002_fix_team_invitations.sql
- Keep old migrations as historical record
```

---

## 🔄 Migration Workflow

```
1. Make code changes
   ↓
2. Identify needed database changes
   ↓
3. Create new migration file
   ↓
4. Test locally (optional: use local Supabase)
   ↓
5. Commit to Git
   ↓
6. Apply to Supabase Dashboard
   ↓
7. Record in schema_migrations table
   ↓
8. Verify changes
```

---

## 📝 Creating a New Migration

### Template:

```sql
-- Migration: [Descriptive Name]
-- Date: 2026-02-07
-- Description: [What this does and why]

-- [Your SQL here]

-- Example:
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rollback (for reference):
-- DROP TABLE IF EXISTS user_settings;
```

### Steps:

1. **Create File:**
   ```bash
   # Find next number
   ls database/migrations/
   
   # Create new file
   # Use next sequential number
   touch database/migrations/002_add_user_settings.sql
   ```

2. **Write SQL:**
   - Use IF NOT EXISTS / IF EXISTS
   - Include comments
   - Add indexes if needed
   - Set up RLS policies

3. **Test (Optional):**
   - Run on local Supabase instance
   - Verify tables/columns created correctly

4. **Commit:**
   ```bash
   git add database/migrations/002_add_user_settings.sql
   git commit -m "Add user settings migration"
   ```

5. **Apply:**
   - Copy SQL to Supabase Dashboard
   - Run migration
   - Record in schema_migrations

---

## 🔍 Checking Migration Status

### See all applied migrations:
```sql
SELECT 
  migration_name,
  applied_at,
  description
FROM schema_migrations 
ORDER BY applied_at;
```

### Check if specific migration was applied:
```sql
SELECT * FROM schema_migrations 
WHERE migration_name = '001_add_team_invitations';
```

### See unapplied migrations:
Compare files in this folder with rows in `schema_migrations` table.

---

## 🆘 Troubleshooting

### **Problem: Migration failed halfway**

1. Check error message
2. Fix the SQL
3. Create new migration to correct the issue:
   ```
   002_fix_team_invitations_error.sql
   ```
4. Don't modify the original migration

### **Problem: Need to undo a migration**

1. Create a new "down" migration:
   ```sql
   -- 003_rollback_team_invitations.sql
   DROP TABLE IF EXISTS team_invitations;
   ALTER TABLE teams DROP COLUMN IF EXISTS max_members;
   ```
2. Apply the rollback migration

### **Problem: Forgot to record migration**

```sql
-- Manually add it:
INSERT INTO schema_migrations (migration_name, description, applied_at) 
VALUES ('001_add_team_invitations', 'Team invitation system', '2026-02-07 10:30:00');
```

---

## 🎓 Example: Full Migration Process

Let's say you want to add tags to todos:

1. **Create Migration File:**
   ```bash
   # Create: database/migrations/002_add_todo_tags.sql
   ```

2. **Write SQL:**
   ```sql
   -- Migration: Add tags to todos
   -- Date: 2026-02-07
   -- Description: Allow todos to have multiple tags for organization
   
   CREATE TABLE IF NOT EXISTS tags (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT UNIQUE NOT NULL,
     color TEXT DEFAULT '#3b82f6',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE TABLE IF NOT EXISTS todo_tags (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
     tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(todo_id, tag_id)
   );
   
   -- Indexes
   CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);
   CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);
   ```

3. **Commit:**
   ```bash
   git add database/migrations/002_add_todo_tags.sql
   git commit -m "Add todo tags migration"
   git push
   ```

4. **Apply in Supabase:**
   - Copy SQL from file
   - Paste in SQL Editor
   - Run
   - Record:
     ```sql
     INSERT INTO schema_migrations (migration_name, description) 
     VALUES ('002_add_todo_tags', 'Add tags system for todos');
     ```

5. **Verify:**
   ```sql
   \dt tags
   \dt todo_tags
   SELECT * FROM schema_migrations;
   ```

Done! ✅

---

## 📚 Additional Resources

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/managing-environments)
- [Database Migration Best Practices](https://www.liquibase.org/get-started/best-practices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🔐 Security Note

**Never commit:**
- Database credentials
- API keys
- Passwords or secrets
- Production connection strings

Only commit:
- Migration SQL files
- Documentation
- Schema definitions

---

## Summary

✅ **Always use migration files** - No memory loss, version controlled  
✅ **Number them sequentially** - Clear order of operations  
✅ **Use idempotent SQL** - Safe to run multiple times  
✅ **Track in schema_migrations** - Know what's been applied  
✅ **Never modify old migrations** - Create new ones instead  
✅ **Commit to Git** - Team can see all changes  

This way, you'll never lose track of database changes! 🎯

