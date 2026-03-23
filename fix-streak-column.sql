-- SQL to add study_streak column if it doesn't exist
-- Run this in your Supabase SQL editor

-- First, check if column exists and add it if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'study_streak'
  ) THEN
    ALTER TABLE profiles ADD COLUMN study_streak INTEGER DEFAULT 0;
    RAISE NOTICE 'Added study_streak column to profiles table';
  ELSE
    RAISE NOTICE 'study_streak column already exists';
  END IF;
END $$;

-- Update any existing profiles to have study_streak = 0
UPDATE profiles 
SET study_streak = 0 
WHERE study_streak IS NULL;

-- Verify the column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'study_streak';
