-- Create system_config table for storing customizable settings
-- Run this SQL in your Supabase SQL Editor when you have database access

CREATE TABLE IF NOT EXISTS system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO system_config (config_key, config_value) VALUES 
('event_settings', '{
  "eventTitle": "IRP Booking System",
  "eventSubtitle": "Innovation & Research Park", 
  "eventDescription": "Book review slots for your project presentations",
  "eventDates": ["2025-10-06", "2025-10-07", "2025-10-08", "2025-10-09", "2025-10-10"],
  "timeSlots": [
    {"id": "1", "time": "1:45 PM - 2:15 PM"},
    {"id": "2", "time": "2:15 PM - 2:45 PM"},
    {"id": "3", "time": "2:45 PM - 3:15 PM"},
    {"id": "4", "time": "3:15 PM - 3:45 PM"}
  ],
  "instructions": [
    "Reviewers will come from industry professionals",
    "Make sure to give a professional presentation",
    "Get your PPT prepared and professional",
    "Once booked, you cannot change your slot",
    "Be punctual and arrive 10 minutes before your slot"
  ]
}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Add RLS policies if needed
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and write system config
CREATE POLICY "Admins can manage system config" ON system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Allow public read access for frontend
CREATE POLICY "Public can read system config" ON system_config
  FOR SELECT USING (true);
