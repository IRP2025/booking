-- Add password column to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN password VARCHAR(255);

-- Optional: Set a default password for existing users (if any)
-- UPDATE users SET password = 'default123' WHERE password IS NULL;
