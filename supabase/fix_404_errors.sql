-- Fix missing tables for 404 errors
-- Run this in your Supabase SQL Editor to create missing user_achievements table
-- and ensure all required tables exist

-- User achievements table (missing from current schema)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('study', 'streak', 'mastery', 'social', 'special')),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- Smart plans table (missing from current schema)
CREATE TABLE IF NOT EXISTS smart_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_days INTEGER DEFAULT 7,
  daily_time_minutes INTEGER DEFAULT 30,
  goals TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on smart_plans
ALTER TABLE smart_plans ENABLE ROW LEVEL SECURITY;

-- Smart plans policies
CREATE POLICY "Users can view own smart plans" ON smart_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own smart plans" ON smart_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart plans" ON smart_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own smart plans" ON smart_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for smart_plans
CREATE INDEX IF NOT EXISTS idx_smart_plans_user_id ON smart_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_plans_status ON smart_plans(status);
CREATE INDEX IF NOT EXISTS idx_smart_plans_subject ON smart_plans(subject);

-- Verify study_sessions table has correct structure
-- (This should already exist from complete_migration.sql but we ensure it's correct)
DO $$
BEGIN
  -- Check if study_sessions table exists and has the right columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_sessions' 
    AND column_name = 'created_at'
  ) THEN
    -- Create study_sessions table if it doesn't exist
    CREATE TABLE study_sessions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'quiz', 'flashcards', 'practice')),
      topic TEXT,
      subject TEXT,
      duration_minutes INTEGER DEFAULT 0,
      performance_score NUMERIC,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    -- Enable RLS
    ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
    
    -- Add policies
    CREATE POLICY "Users can view own study sessions" ON study_sessions
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create own study sessions" ON study_sessions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own study sessions" ON study_sessions
      FOR UPDATE USING (auth.uid() = user_id);
    
    -- Add index
    CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
  END IF;
END $$;

-- Verify user_performance table has correct structure
DO $$
BEGIN
  -- Check if user_performance table exists and has the right columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_performance' 
    AND column_name = 'created_at'
  ) THEN
    -- Create user_performance table if it doesn't exist
    CREATE TABLE user_performance (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT,
      quiz_scores INTEGER[] DEFAULT '{}',
      average_score NUMERIC,
      total_attempts INTEGER DEFAULT 0,
      weak_concepts TEXT[] DEFAULT '{}',
      strong_concepts TEXT[] DEFAULT '{}',
      last_studied_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      UNIQUE(user_id, subject, topic)
    );
    
    -- Enable RLS
    ALTER TABLE user_performance ENABLE ROW LEVEL SECURITY;
    
    -- Add policies
    CREATE POLICY "Users can view own performance" ON user_performance
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create own performance records" ON user_performance
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own performance records" ON user_performance
      FOR UPDATE USING (auth.uid() = user_id);
    
    -- Add indexes
    CREATE INDEX idx_user_performance_user_id ON user_performance(user_id);
    CREATE INDEX idx_user_performance_subject ON user_performance(subject);
  END IF;
END $$;
