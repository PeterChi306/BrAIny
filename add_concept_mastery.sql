-- Add concept mastery tracking table
CREATE TABLE IF NOT EXISTS concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  practice_count INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique concept per user
  UNIQUE(user_id, concept_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user_id ON concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_updated_at ON concept_mastery(updated_at DESC);

-- Add streak freeze and last activity date to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS streak_freeze_used BOOLEAN DEFAULT FALSE;

-- Create index for streak tracking
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity_date ON profiles(last_activity_date DESC);

-- Add RLS policies for concept mastery
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own concept mastery" ON concept_mastery
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own concept mastery" ON concept_mastery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own concept mastery" ON concept_mastery
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_concept_mastery_updated_at 
  BEFORE UPDATE ON concept_mastery 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
