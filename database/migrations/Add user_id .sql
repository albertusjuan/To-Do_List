-- Quick fix: Add user_id column
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID;

-- Set a default for existing todos (use your user ID or leave NULL)
-- UPDATE todos SET user_id = auth.uid() WHERE user_id IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);