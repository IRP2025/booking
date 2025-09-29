-- Fix users table constraints to allow simplified user creation
-- Run this in your Supabase SQL Editor

-- Make the required columns nullable since we're only using roll_no and password
ALTER TABLE users 
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN department DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN year DROP NOT NULL;

-- Set default values for these columns when creating users
ALTER TABLE users 
ALTER COLUMN name SET DEFAULT '',
ALTER COLUMN department SET DEFAULT '',
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN year SET DEFAULT 1;
