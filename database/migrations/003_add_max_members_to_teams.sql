-- Add max_members column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 10 CHECK (max_members >= 1 AND max_members <= 100);

-- Update existing teams to have default max_members
UPDATE teams SET max_members = 10 WHERE max_members IS NULL;

