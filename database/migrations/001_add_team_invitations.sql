-- Migration: Add team member invitations and max_members
-- Date: 2026-02-07
-- Description: Adds team member invitation system with max member limits

-- 1. Add max_members column to teams table
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 10 NOT NULL;

-- Add constraint to ensure max_members is at least 1
ALTER TABLE teams
ADD CONSTRAINT teams_max_members_check CHECK (max_members >= 1 AND max_members <= 100);

-- 2. Add email column to team_members table
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- 3. Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(team_id, email)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- 4. Create function to check team member limit before adding
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_member_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current member count and max allowed
  SELECT COUNT(*), t.max_members
  INTO current_member_count, max_allowed
  FROM team_members tm
  JOIN teams t ON t.id = NEW.team_id
  WHERE tm.team_id = NEW.team_id
  GROUP BY t.max_members;

  -- If first member, allow
  IF current_member_count IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if adding this member would exceed the limit
  IF current_member_count >= max_allowed THEN
    RAISE EXCEPTION 'Team has reached maximum member limit of %', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to enforce member limit
DROP TRIGGER IF EXISTS enforce_team_member_limit ON team_members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- 6. Create function to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'rejected'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 7. Row Level Security (RLS) policies for team_invitations

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations for their email
CREATE POLICY "Users can view their own invitations"
  ON team_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );

-- Team owners can create invitations
CREATE POLICY "Team owners can create invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = team_invitations.team_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Users can update their own invitation status
CREATE POLICY "Users can update their invitation status"
  ON team_invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (status IN ('accepted', 'rejected'));

-- Team owners can delete invitations
CREATE POLICY "Team owners can delete invitations"
  ON team_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = team_invitations.team_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- 8. Create view for team member count
CREATE OR REPLACE VIEW team_member_counts AS
SELECT 
  t.id as team_id,
  t.max_members,
  COUNT(tm.id) as current_members,
  t.max_members - COUNT(tm.id) as available_slots
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.id, t.max_members;

COMMENT ON TABLE team_invitations IS 'Stores pending, accepted, and rejected team invitations';
COMMENT ON COLUMN teams.max_members IS 'Maximum number of members allowed in the team (1-100)';
COMMENT ON FUNCTION check_team_member_limit() IS 'Prevents adding members beyond team limit';
COMMENT ON FUNCTION expire_old_invitations() IS 'Marks expired pending invitations as rejected';

