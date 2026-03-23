-- COMPLETE DATABASE FIX - All Missing Tables
-- Run this in your Supabase SQL Editor to fix ALL 404 errors

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MISSING TABLES FROM CODE REFERENCES
-- =====================================================

-- Flashcard sessions table (referenced in flashcards/page.tsx)
CREATE TABLE IF NOT EXISTS flashcard_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT,
  total_cards INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  mastery_percentage INTEGER DEFAULT 0,
  session_duration INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- XP transactions table (referenced in gamification.ts)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'quiz', 'streak', 'achievement', etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Notifications table (referenced in gamification.ts)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'achievement', 'streak', 'reminder', etc.
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- ENSURE ALL CORE TABLES EXIST (from complete_migration.sql)
-- =====================================================

-- Profiles table (extends auth.users) - ADD total_xp if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_xp') THEN
    ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      grade_level TEXT,
      subjects TEXT[] DEFAULT '{}',
      study_goals TEXT[] DEFAULT '{}',
      learning_style TEXT,
      total_xp INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    CREATE TABLE subscriptions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'master')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      UNIQUE(user_id)
    );
    
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Chats table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chats') THEN
    CREATE TABLE chats (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('explain', 'practice', 'quiz', 'review')),
      subject TEXT,
      title TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own chats" ON chats FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Messages table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    CREATE TABLE messages (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view messages in own chats" ON messages FOR SELECT USING (
      EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
    );
    
    CREATE POLICY "Users can create messages in own chats" ON messages FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
    );
  END IF;
END $$;

-- Scans table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scans') THEN
    CREATE TABLE scans (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      image_url TEXT,
      extracted_text TEXT,
      subject TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own scans" ON scans FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own scans" ON scans FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own scans" ON scans FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own scans" ON scans FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Daily usage table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_usage') THEN
    CREATE TABLE daily_usage (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      ai_messages_count INTEGER DEFAULT 0,
      scans_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      UNIQUE(user_id, date)
    );
    
    ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own usage" ON daily_usage FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can update own usage" ON daily_usage FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own usage" ON daily_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Quizzes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quizzes') THEN
    CREATE TABLE quizzes (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      topic TEXT NOT NULL,
      subject TEXT,
      difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
      score INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
      weak_areas TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own quizzes" ON quizzes FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own quizzes" ON quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own quizzes" ON quizzes FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own quizzes" ON quizzes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Quiz questions table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_questions') THEN
    CREATE TABLE quiz_questions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT[] NOT NULL,
      correct_answer INTEGER NOT NULL,
      user_answer INTEGER,
      is_correct BOOLEAN,
      explanation TEXT,
      question_number INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view questions in own quizzes" ON quiz_questions FOR SELECT USING (
      EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid())
    );
    
    CREATE POLICY "Users can create questions in own quizzes" ON quiz_questions FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid())
    );
    
    CREATE POLICY "Users can update questions in own quizzes" ON quiz_questions FOR UPDATE USING (
      EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid())
    );
  END IF;
END $$;

-- Flashcards table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcards') THEN
    CREATE TABLE flashcards (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      front_text TEXT NOT NULL,
      back_text TEXT NOT NULL,
      subject TEXT,
      topic TEXT,
      difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
      last_reviewed_at TIMESTAMP WITH TIME ZONE,
      next_review_at TIMESTAMP WITH TIME ZONE,
      review_count INTEGER DEFAULT 0,
      mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own flashcards" ON flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own flashcards" ON flashcards FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own flashcards" ON flashcards FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- TABLES FROM PREVIOUS FIX SCRIPTS
-- =====================================================

-- Study sessions table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_sessions') THEN
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
    
    ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own study sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own study sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own study sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- User performance table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_performance') THEN
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
    
    ALTER TABLE user_performance ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own performance" ON user_performance FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own performance records" ON user_performance FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own performance records" ON user_performance FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- User achievements table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
    CREATE TABLE user_achievements (
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
    
    ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Smart plans table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smart_plans') THEN
    CREATE TABLE smart_plans (
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
    
    ALTER TABLE smart_plans ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own smart plans" ON smart_plans FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own smart plans" ON smart_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own smart plans" ON smart_plans FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own smart plans" ON smart_plans FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- COGNITIVE TRAINING TABLES (from cognitive_schema.sql)
-- =====================================================

-- Thinking fingerprints table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thinking_fingerprints') THEN
    CREATE TABLE thinking_fingerprints (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      concept_mastery JSONB NOT NULL DEFAULT '[]',
      misconception_patterns JSONB NOT NULL DEFAULT '[]',
      confidence_accuracy_mismatch JSONB NOT NULL DEFAULT '[]',
      reasoning_depth JSONB NOT NULL DEFAULT '{}',
      hint_dependency JSONB NOT NULL DEFAULT '{}',
      response_latency JSONB NOT NULL DEFAULT '{}',
      cognitive_entry_points JSONB NOT NULL DEFAULT '{}',
      thinking_growth_trajectory JSONB NOT NULL DEFAULT '{}',
      cognitive_weaknesses JSONB NOT NULL DEFAULT '[]',
      cognitive_strengths JSONB NOT NULL DEFAULT '[]',
      avoidance_behaviors JSONB NOT NULL DEFAULT '[]',
      persistence_patterns JSONB NOT NULL DEFAULT '[]',
      metacognitive_awareness JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE thinking_fingerprints ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own thinking fingerprint" ON thinking_fingerprints FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can update own thinking fingerprint" ON thinking_fingerprints FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own thinking fingerprint" ON thinking_fingerprints FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- User interactions table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_interactions') THEN
    CREATE TABLE user_interactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      session_id UUID NOT NULL,
      problem_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('learn', 'practice', 'reflect', 'review')),
      response TEXT NOT NULL,
      confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
      time_to_response INTEGER,
      hints_used INTEGER DEFAULT 0,
      correctness DECIMAL(3,2) CHECK (correctness >= 0 AND correctness <= 1),
      reasoning_depth INTEGER CHECK (reasoning_depth >= 1 AND reasoning_depth <= 5),
      thinking_gates_passed JSONB NOT NULL DEFAULT '[]',
      thinking_gates_failed JSONB NOT NULL DEFAULT '[]',
      constraints_applied JSONB NOT NULL DEFAULT '[]',
      friction_level INTEGER CHECK (friction_level >= 1 AND friction_level <= 5),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own interactions" ON user_interactions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own interactions" ON user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_user_id ON flashcard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_performance_user_id ON user_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_subject ON user_performance(subject);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_smart_plans_user_id ON smart_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_plans_status ON smart_plans(status);
CREATE INDEX IF NOT EXISTS idx_thinking_fingerprints_user_id ON thinking_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  INSERT INTO public.subscriptions (user_id, tier)
  VALUES (NEW.id, 'free');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_performance_updated_at
  BEFORE UPDATE ON user_performance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_smart_plans_updated_at
  BEFORE UPDATE ON smart_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_thinking_fingerprints_updated_at 
  BEFORE UPDATE ON thinking_fingerprints 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
