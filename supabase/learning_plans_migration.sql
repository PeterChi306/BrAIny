-- Learning Goals Table
CREATE TABLE IF NOT EXISTS learning_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('exam', 'skill', 'grade', 'deadline')),
  target_date DATE,
  subject TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  current_level INTEGER DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 100),
  target_level INTEGER DEFAULT 100 CHECK (target_level >= 0 AND target_level <= 100),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Study Plans Table
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES learning_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  current_day INTEGER DEFAULT 1,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Daily Plans Table
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  study_plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  sessions JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(study_plan_id, day_number)
);

-- Progress Trackers Table
CREATE TABLE IF NOT EXISTS progress_trackers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES learning_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  completion_rate DECIMAL(5,2) CHECK (completion_rate >= 0 AND completion_rate <= 100),
  average_performance DECIMAL(5,2) CHECK (average_performance >= 0 AND average_performance <= 100),
  streak_days INTEGER DEFAULT 0,
  weak_areas TEXT[] DEFAULT '{}',
  strong_areas TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(goal_id, date)
);

-- Adaptive Sessions Table
CREATE TABLE IF NOT EXISTS adaptive_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES learning_goals(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('review', 'recall', 'practice', 'quiz', 'explain')),
  state TEXT NOT NULL DEFAULT 'review' CHECK (state IN ('review', 'recall', 'practice', 'quiz', 'summary', 'completed')),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 1,
  content JSONB DEFAULT '{}'::jsonb,
  performance JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Timed Quiz Configs Table
CREATE TABLE IF NOT EXISTS timed_quiz_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES learning_goals(id) ON DELETE CASCADE NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 10,
  time_per_question INTEGER NOT NULL DEFAULT 60,
  adaptive_difficulty BOOLEAN DEFAULT true,
  allow_hints BOOLEAN DEFAULT false,
  allow_backtrack BOOLEAN DEFAULT false,
  show_progress BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Timed Quiz Sessions Table
CREATE TABLE IF NOT EXISTS timed_quiz_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  config_id UUID REFERENCES timed_quiz_configs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  current_question INTEGER DEFAULT 0,
  total_time_seconds INTEGER NOT NULL,
  time_remaining_seconds INTEGER NOT NULL,
  is_paused BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Speech Settings Table
CREATE TABLE IF NOT EXISTS speech_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  voice_type TEXT DEFAULT 'neutral' CHECK (voice_type IN ('male', 'female', 'neutral')),
  speech_rate DECIMAL(3,1) DEFAULT 1.0 CHECK (speech_rate >= 0.5 AND speech_rate <= 2.0),
  volume DECIMAL(3,1) DEFAULT 1.0 CHECK (volume >= 0.0 AND volume <= 1.0),
  auto_speak_explanations BOOLEAN DEFAULT true,
  auto_speak_feedback BOOLEAN DEFAULT true,
  pause_during_input BOOLEAN DEFAULT true,
  daily_limit_minutes INTEGER DEFAULT 30,
  used_minutes_today INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- Spaced Repetition Cards Table
CREATE TABLE IF NOT EXISTS spaced_repetition_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES learning_goals(id) ON DELETE CASCADE NULL,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  concept_tags TEXT[] DEFAULT '{}',
  easiness_factor DECIMAL(4,2) DEFAULT 2.5 CHECK (easiness_factor >= 1.3),
  repetition_count INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 1,
  next_review_date DATE NOT NULL,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  performance_history INTEGER[] DEFAULT '{}',
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Learner Models Table
CREATE TABLE IF NOT EXISTS learner_models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  concept_mastery JSONB DEFAULT '{}'::jsonb,
  strength_areas TEXT[] DEFAULT '{}',
  weakness_areas TEXT[] DEFAULT '{}',
  preferred_difficulty TEXT DEFAULT 'medium' CHECK (preferred_difficulty IN ('easy', 'medium', 'hard')),
  learning_speed TEXT DEFAULT 'moderate' CHECK (learning_speed IN ('slow', 'moderate', 'fast')),
  retention_rate DECIMAL(5,2) DEFAULT 80.0 CHECK (retention_rate >= 0 AND retention_rate <= 100),
  engagement_patterns JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, subject)
);

-- Enable RLS on new tables
ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timed_quiz_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE timed_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Learning Goals
CREATE POLICY "Users can view own learning goals" ON learning_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning goals" ON learning_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning goals" ON learning_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning goals" ON learning_goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Study Plans
CREATE POLICY "Users can view own study plans" ON study_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study plans" ON study_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans" ON study_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study plans" ON study_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Daily Plans
CREATE POLICY "Users can view own daily plans" ON daily_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM study_plans 
      WHERE study_plans.id = daily_plans.study_plan_id 
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own daily plans" ON daily_plans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_plans 
      WHERE study_plans.id = daily_plans.study_plan_id 
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own daily plans" ON daily_plans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM study_plans 
      WHERE study_plans.id = daily_plans.study_plan_id 
      AND study_plans.user_id = auth.uid()
    )
  );

-- RLS Policies for Progress Trackers
CREATE POLICY "Users can view own progress trackers" ON progress_trackers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress trackers" ON progress_trackers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress trackers" ON progress_trackers
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Adaptive Sessions
CREATE POLICY "Users can view own adaptive sessions" ON adaptive_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own adaptive sessions" ON adaptive_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adaptive sessions" ON adaptive_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Timed Quiz Configs
CREATE POLICY "Users can view own timed quiz configs" ON timed_quiz_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_goals 
      WHERE learning_goals.id = timed_quiz_configs.goal_id 
      AND learning_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own timed quiz configs" ON timed_quiz_configs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_goals 
      WHERE learning_goals.id = timed_quiz_configs.goal_id 
      AND learning_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own timed quiz configs" ON timed_quiz_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM learning_goals 
      WHERE learning_goals.id = timed_quiz_configs.goal_id 
      AND learning_goals.user_id = auth.uid()
    )
  );

-- RLS Policies for Timed Quiz Sessions
CREATE POLICY "Users can view own timed quiz sessions" ON timed_quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own timed quiz sessions" ON timed_quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timed quiz sessions" ON timed_quiz_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Speech Settings
CREATE POLICY "Users can view own speech settings" ON speech_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own speech settings" ON speech_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own speech settings" ON speech_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Spaced Repetition Cards
CREATE POLICY "Users can view own spaced repetition cards" ON spaced_repetition_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spaced repetition cards" ON spaced_repetition_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spaced repetition cards" ON spaced_repetition_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spaced repetition cards" ON spaced_repetition_cards
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Learner Models
CREATE POLICY "Users can view own learner models" ON learner_models
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learner models" ON learner_models
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learner models" ON learner_models
  FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_learning_goals_updated_at
  BEFORE UPDATE ON learning_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_study_plans_updated_at
  BEFORE UPDATE ON study_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_speech_settings_updated_at
  BEFORE UPDATE ON speech_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_spaced_repetition_cards_updated_at
  BEFORE UPDATE ON spaced_repetition_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_learner_models_updated_at
  BEFORE UPDATE ON learner_models
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX idx_learning_goals_user_id ON learning_goals(user_id);
CREATE INDEX idx_learning_goals_status ON learning_goals(status);
CREATE INDEX idx_study_plans_goal_id ON study_plans(goal_id);
CREATE INDEX idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX idx_daily_plans_study_plan_id ON daily_plans(study_plan_id);
CREATE INDEX idx_daily_plans_date ON daily_plans(date);
CREATE INDEX idx_progress_trackers_goal_id ON progress_trackers(goal_id);
CREATE INDEX idx_progress_trackers_date ON progress_trackers(date);
CREATE INDEX idx_adaptive_sessions_user_id ON adaptive_sessions(user_id);
CREATE INDEX idx_adaptive_sessions_goal_id ON adaptive_sessions(goal_id);
CREATE INDEX idx_timed_quiz_sessions_user_id ON timed_quiz_sessions(user_id);
CREATE INDEX idx_spaced_repetition_cards_user_id ON spaced_repetition_cards(user_id);
CREATE INDEX idx_spaced_repetition_cards_next_review ON spaced_repetition_cards(next_review_date);
CREATE INDEX idx_learner_models_user_id ON learner_models(user_id);
