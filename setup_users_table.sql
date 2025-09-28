-- Run this SQL in your Supabase SQL Editor to set up the users table

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  roll_no VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  password VARCHAR(255) NOT NULL,
  team_lead_name VARCHAR(255),
  team_lead_roll_no VARCHAR(50),
  project_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_roll_no ON users(roll_no);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
