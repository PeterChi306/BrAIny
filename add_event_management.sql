-- Add AI-powered event management columns to user_deadlines table
ALTER TABLE user_deadlines 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_instructions TEXT,
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_time TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on archived events
CREATE INDEX idx_user_deadlines_archived ON user_deadlines(user_id, is_archived);

-- Create index for reminder tracking
CREATE INDEX idx_user_deadlines_reminders ON user_deadlines(reminder_sent, deadline_date);
