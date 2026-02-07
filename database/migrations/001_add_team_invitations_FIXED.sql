-- Migration: Add team member invitations and max_members (FIXED VERSION)
-- Date: 2026-02-07
-- Description: Adds team member invitation system with max member limits
-- FIX: Enables UUID extension and handles all type issues

-- CRITICAL: Enable UUID extension first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_uuid()

-- STEP 1: Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Add max_members column to teams table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE teams ADD COLUMN max_members INTEGER DEFAULT 10 NOT NULL;
  END IF;
END $$;

-- Add constraint to ensure max_members is at least 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teams_max_members_check'
  ) THEN
    ALTER TABLE teams ADD CONSTRAINT teams_max_members_check 
    CHECK (max_members >= 1 AND max_members <= 100);
  END IF;
END $$;

-- STEP 3: Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- STEP 4: Add email column to team_members table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'email'
  ) THEN
    ALTER TABLE team_members ADD COLUMN email TEXT;
  END IF;
END $$;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- STEP 5: Create team_invitations table
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

-- STEP 6: Create function to check team member limit before adding
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_member_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get max allowed for this team
  SELECT max_members INTO max_allowed
  FROM teams
  WHERE id = NEW.team_id;

  -- Get current member count for this team
  SELECT COUNT(*) INTO current_member_count
  FROM team_members
  WHERE team_id = NEW.team_id;

  -- If current_member_count is NULL (no members yet), allow
  IF current_member_count IS NULL THEN
    current_member_count := 0;
  END IF;

  -- Check if adding this member would exceed the limit
  IF current_member_count >= max_allowed THEN
    RAISE EXCEPTION 'Team has reached maximum member limit of %', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Create trigger to enforce member limit
DROP TRIGGER IF EXISTS enforce_team_member_limit ON team_members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- STEP 8: Create function to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'rejected'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- STEP 10: Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can update their invitation status" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can delete invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON teams;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Team owners can add members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;

-- STEP 11: RLS Policies for team_invitations
CREATE POLICY "Users can view their own invitations"
  ON team_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );

CREATE POLICY "Team owners can create invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

CREATE POLICY "Users can update their invitation status"
  ON team_invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (status IN ('accepted', 'rejected'));

CREATE POLICY "Team owners can delete invitations"
  ON team_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

-- STEP 12: RLS Policies for teams
CREATE POLICY "Users can view teams they are members of"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Team owners can update teams"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

CREATE POLICY "Team owners can delete teams"
  ON teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

-- STEP 13: RLS Policies for team_members
CREATE POLICY "Users can view team members of their teams"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can add members"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

CREATE POLICY "Team owners can remove members"
  ON team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

-- STEP 14: Create view for team member count
CREATE OR REPLACE VIEW team_member_counts AS
SELECT 
  t.id as team_id,
  t.max_members,
  COUNT(tm.id) as current_members,
  t.max_members - COUNT(tm.id) as available_slots
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.id, t.max_members;

-- STEP 15: Add helpful comments
COMMENT ON TABLE teams IS 'Teams that users can create and join';
COMMENT ON TABLE team_members IS 'Members of teams with their roles';
COMMENT ON TABLE team_invitations IS 'Stores pending, accepted, and rejected team invitations';
COMMENT ON COLUMN teams.max_members IS 'Maximum number of members allowed in the team (1-100)';
COMMENT ON COLUMN team_members.role IS 'Role of the member: owner or member';
COMMENT ON FUNCTION check_team_member_limit() IS 'Prevents adding members beyond team limit';
COMMENT ON FUNCTION expire_old_invitations() IS 'Marks expired pending invitations as rejected';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 completed successfully!';
  RAISE NOTICE '✅ UUID extension enabled';
  RAISE NOTICE '✅ Teams, team_members, and team_invitations tables created';
  RAISE NOTICE '✅ RLS policies applied';
  RAISE NOTICE '✅ Triggers and functions created';
END $$;

