-- Run this SQL in your Supabase SQL Editor to set up admin authentication

-- First, let's check the current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;

-- Update the existing admin user with the correct password
UPDATE admin_users 
SET password_hash = '2004', 
    updated_at = NOW()
WHERE username = 'admin';

-- If no admin user exists, insert one
INSERT INTO admin_users (username, password_hash) 
SELECT 'admin', '2004'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Verify the admin user was created/updated
SELECT * FROM admin_users WHERE username = 'admin';
