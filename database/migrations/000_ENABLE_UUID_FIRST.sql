-- CRITICAL: Run this FIRST before any other migrations
-- This enables UUID support in your database

-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Test UUID generation
DO $$
DECLARE
  test_uuid UUID;
BEGIN
  test_uuid := gen_random_uuid();
  RAISE NOTICE 'UUID extension working! Test UUID: %', test_uuid;
END $$;

-- Show all available extensions
SELECT * FROM pg_available_extensions WHERE name LIKE '%uuid%' OR name LIKE '%crypto%';

