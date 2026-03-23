-- Gamification System Tables Migration
-- Run this in your Supabase SQL Editor to add gamification features

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS study_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_study_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, achievement_id)
);

-- Create XP transactions table
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weekly_xp INTEGER DEFAULT 0,
  weekly_rank INTEGER DEFAULT 0,
  week_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS on new tables
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for xp_transactions
CREATE POLICY "Users can view own XP transactions" ON xp_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own XP transactions" ON xp_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for leaderboard
CREATE POLICY "Users can view leaderboard" ON leaderboard
  FOR SELECT USING (true); -- Anyone can view leaderboard

CREATE POLICY "Users can create own leaderboard entry" ON leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entry" ON leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at on new tables
CREATE TRIGGER update_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW EXECUTE public.handle_updated_at();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE public.handle_updated_at();

-- Function to update study streak
CREATE OR REPLACE FUNCTION public.update_study_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Update study streak when daily_usage is updated
  IF TG_TABLE_NAME = 'daily_usage' THEN
    -- Check if this is the first activity today
    IF NEW.ai_messages_count > 0 OR NEW.scans_count > 0 THEN
      -- Get current streak and last activity date
      WITH last_activity AS (
        SELECT 
          p.study_streak,
          MAX(du.date) as last_date
        FROM profiles p
        LEFT JOIN daily_usage du ON p.id = du.user_id AND du.date < NEW.date
        WHERE p.id = NEW.user_id
        GROUP BY p.study_streak
      )
      UPDATE profiles 
      SET study_streak = CASE 
        WHEN last_activity.last_date = NEW.date - INTERVAL '1 day' THEN study_streak + 1
        WHEN last_activity.last_date < NEW.date - INTERVAL '1 day' OR last_activity.last_date IS NULL THEN 1
        ELSE study_streak
      END
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update study streak
DROP TRIGGER IF EXISTS update_study_streak_trigger ON daily_usage;
CREATE TRIGGER update_study_streak_trigger
  AFTER INSERT OR UPDATE ON daily_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_study_streak();

-- Function to calculate mastery level for flashcards
CREATE OR REPLACE FUNCTION public.calculate_flashcard_mastery()
RETURNS TRIGGER AS $$
BEGIN
  -- Update mastery level based on review count and performance
  IF NEW.review_count >= 10 THEN
    NEW.mastery_level = LEAST(5, NEW.review_count / 10);
  ELSIF NEW.review_count >= 5 THEN
    NEW.mastery_level = 2;
  ELSIF NEW.review_count >= 2 THEN
    NEW.mastery_level = 1;
  ELSE
    NEW.mastery_level = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate flashcard mastery
DROP TRIGGER IF EXISTS calculate_flashcard_mastery_trigger ON flashcards;
CREATE TRIGGER calculate_flashcard_mastery_trigger
  BEFORE INSERT OR UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION public.calculate_flashcard_mastery();
