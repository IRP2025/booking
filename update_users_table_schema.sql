-- Update users table to include team members and projects done
-- Add new columns for team members and projects done

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS team_members JSONB,
ADD COLUMN IF NOT EXISTS projects_done JSONB;

-- Update existing records to have default values
UPDATE users 
SET 
  team_members = '[]'::jsonb,
  projects_done = '[]'::jsonb
WHERE team_members IS NULL OR projects_done IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN users.team_members IS 'JSON array of team members with name and rollNo';
COMMENT ON COLUMN users.projects_done IS 'JSON array of completed project names';
