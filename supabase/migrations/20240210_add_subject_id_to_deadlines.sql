-- Add subject_id field to user_deadlines table
ALTER TABLE user_deadlines 
ADD COLUMN subject_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_deadlines_subject_id ON user_deadlines(subject_id);

-- Add comment for documentation
COMMENT ON COLUMN user_deadlines.subject_id IS 'Reference to the subject ID from the subjects library for detailed AI context';
