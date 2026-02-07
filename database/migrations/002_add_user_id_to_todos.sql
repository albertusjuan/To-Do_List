-- Migration: Add user_id to todos table
-- Date: 2026-02-07
-- Description: Associate todos with users for proper data isolation
-- CRITICAL: This fixes the bug where all users see all todos

-- 1. Add user_id column to todos table
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

-- 3. Create composite index for common queries (user + team)
CREATE INDEX IF NOT EXISTS idx_todos_user_team ON todos(user_id, team_id);

-- 4. Update existing todos to set user_id (if any exist without one)
-- NOTE: You'll need to manually assign these if you have existing data
-- For now, we'll leave them NULL and they won't be visible to anyone
-- until properly assigned

-- 5. Make user_id NOT NULL for future todos
-- Uncomment this after you've assigned user_id to all existing todos:
-- ALTER TABLE todos ALTER COLUMN user_id SET NOT NULL;

-- 6. Row Level Security (RLS) Policies for todos

-- Enable RLS on todos table
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own personal todos (team_id IS NULL)
CREATE POLICY "Users can view their own personal todos"
  ON todos FOR SELECT
  USING (
    user_id = auth.uid() 
    AND team_id IS NULL
  );

-- Policy: Users can view todos from teams they're members of
CREATE POLICY "Users can view team todos they belong to"
  ON todos FOR SELECT
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = todos.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own personal todos
CREATE POLICY "Users can create their own personal todos"
  ON todos FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND team_id IS NULL
  );

-- Policy: Users can insert team todos if they're team members
CREATE POLICY "Users can create team todos if they're members"
  ON todos FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = todos.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own personal todos
CREATE POLICY "Users can update their own personal todos"
  ON todos FOR UPDATE
  USING (
    user_id = auth.uid()
    AND team_id IS NULL
  )
  WITH CHECK (
    user_id = auth.uid()
    AND team_id IS NULL
  );

-- Policy: Users can update team todos if they're team members
CREATE POLICY "Users can update team todos if they're members"
  ON todos FOR UPDATE
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = todos.team_id
        AND team_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = todos.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own personal todos
CREATE POLICY "Users can delete their own personal todos"
  ON todos FOR DELETE
  USING (
    user_id = auth.uid()
    AND team_id IS NULL
  );

-- Policy: Users can delete team todos if they're team members
CREATE POLICY "Users can delete team todos if they're members"
  ON todos FOR DELETE
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = todos.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- 7. Add comments for documentation
COMMENT ON COLUMN todos.user_id IS 'The user who owns this todo (creator)';
COMMENT ON POLICY "Users can view their own personal todos" ON todos IS 'Personal todos are only visible to their creator';
COMMENT ON POLICY "Users can view team todos they belong to" ON todos IS 'Team todos are visible to all team members';

-- 8. Create function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_todo_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not provided, set it to the current user
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to auto-set user_id
DROP TRIGGER IF EXISTS trigger_set_todo_user_id ON todos;
CREATE TRIGGER trigger_set_todo_user_id
  BEFORE INSERT ON todos
  FOR EACH ROW
  EXECUTE FUNCTION set_todo_user_id();

-- Rollback commands (for reference):
-- DROP TRIGGER IF EXISTS trigger_set_todo_user_id ON todos;
-- DROP FUNCTION IF EXISTS set_todo_user_id();
-- DROP POLICY IF EXISTS "Users can delete team todos if they're members" ON todos;
-- DROP POLICY IF EXISTS "Users can delete their own personal todos" ON todos;
-- DROP POLICY IF EXISTS "Users can update team todos if they're members" ON todos;
-- DROP POLICY IF EXISTS "Users can update their own personal todos" ON todos;
-- DROP POLICY IF EXISTS "Users can create team todos if they're members" ON todos;
-- DROP POLICY IF EXISTS "Users can create their own personal todos" ON todos;
-- DROP POLICY IF EXISTS "Users can view team todos they belong to" ON todos;
-- DROP POLICY IF EXISTS "Users can view their own personal todos" ON todos;
-- ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
-- DROP INDEX IF EXISTS idx_todos_user_team;
-- DROP INDEX IF EXISTS idx_todos_user_id;
-- ALTER TABLE todos DROP COLUMN IF EXISTS user_id;

