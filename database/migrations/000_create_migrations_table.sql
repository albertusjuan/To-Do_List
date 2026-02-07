-- Migration: Create migrations tracking table
-- Date: 2026-02-07
-- Description: Track which migrations have been applied to prevent duplicate runs
-- RUN THIS FIRST before any other migrations!

-- Create schema_migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  checksum TEXT
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_name 
ON schema_migrations(migration_name);

-- Add comments
COMMENT ON TABLE schema_migrations IS 'Tracks which database migrations have been applied';
COMMENT ON COLUMN schema_migrations.migration_name IS 'Unique name of the migration file';
COMMENT ON COLUMN schema_migrations.applied_at IS 'When the migration was applied';
COMMENT ON COLUMN schema_migrations.checksum IS 'Optional checksum to verify migration integrity';

-- Example: How to record a migration
-- INSERT INTO schema_migrations (migration_name, description) 
-- VALUES ('add_team_invitations', 'Added team member invitation system');

-- Query to check which migrations have been applied:
-- SELECT * FROM schema_migrations ORDER BY applied_at;

