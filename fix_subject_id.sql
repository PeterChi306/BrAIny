-- Manual SQL to add subject_id column to user_deadlines table
-- Run this in Supabase SQL Editor

-- Add subject_id column
ALTER TABLE user_deadlines 
ADD COLUMN subject_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_deadlines_subject_id ON user_deadlines(subject_id);

-- Add comment for documentation
COMMENT ON COLUMN user_deadlines.subject_id IS 'Reference to subject ID from subjects library for detailed AI context';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_deadlines' 
  AND column_name = 'subject_id';
