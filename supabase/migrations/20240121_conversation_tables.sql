-- Conversation and Chat Tables for Real AI Interaction Data

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  subject TEXT,
  topic TEXT,
  mode TEXT DEFAULT 'tutor', -- tutor, quiz, review, etc.
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time user rankings and achievements
CREATE TABLE IF NOT EXISTS user_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  weekly_rank INTEGER DEFAULT 0,
  all_time_rank INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievement_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Easier achievements with real progress tracking
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  category TEXT NOT NULL, -- study, streak, mastery, social, special
  progress_value INTEGER DEFAULT 0, -- 0-100 progress
  max_progress INTEGER DEFAULT 100,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time activity feed for social features
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('achievement', 'level_up', 'streak_milestone', 'study_session', 'quiz_score')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB, -- Store additional data like scores, topics, etc.
  is_public BOOLEAN DEFAULT TRUE, -- Users can choose privacy
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community leaderboard (weekly and all-time)
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'all_time')),
  subject TEXT, -- Optional subject-specific leaderboards
  rank_type TEXT NOT NULL CHECK (rank_type IN ('xp', 'level', 'streak', 'achievements')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  rank_position INTEGER NOT NULL,
  previous_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User study statistics (real-time tracking)
CREATE TABLE IF NOT EXISTS study_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  study_time_minutes INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  topics_studied TEXT[], -- Array of topics studied
  difficulty_distribution JSONB, -- {easy: count, medium: count, hard: count}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- User connections/friends for social features
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_last_message ON chat_sessions(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_weekly_xp ON user_rankings(weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_total_xp ON user_rankings(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked ON user_achievements(user_id, is_unlocked);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_created ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period_rank ON leaderboards(period, rank_position ASC);
CREATE INDEX IF NOT EXISTS idx_study_statistics_user_date ON study_statistics(user_id, date DESC);

-- RLS (Row Level Security) policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat messages" ON chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Rankings are public read-only
CREATE POLICY "Anyone can view rankings" ON user_rankings FOR SELECT USING (true);
CREATE POLICY "System can update rankings" ON user_rankings FOR ALL USING (auth.role() = 'service_role');

-- Achievements are personal but some data is public
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- Activity feed privacy controls
CREATE POLICY "Users can view own activity" ON activity_feed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public activity" ON activity_feed FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own activity" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity privacy" ON activity_feed FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboards are public
CREATE POLICY "Anyone can view leaderboards" ON leaderboards FOR SELECT USING (true);
CREATE POLICY "System can update leaderboards" ON leaderboards FOR ALL USING (auth.role() = 'service_role');

-- Study statistics are personal
CREATE POLICY "Users can view own study stats" ON study_statistics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study stats" ON study_statistics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study stats" ON study_statistics FOR UPDATE USING (auth.uid() = user_id);

-- User connections are private
CREATE POLICY "Users can view own connections" ON user_connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create connections" ON user_connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update received connections" ON user_connections FOR UPDATE USING (auth.uid() = addressee_id);

-- Function to automatically update rankings
CREATE OR REPLACE FUNCTION update_user_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update weekly XP rankings
  INSERT INTO user_rankings (user_id, weekly_xp, total_xp, weekly_rank, all_time_rank, updated_at)
  SELECT 
    user_id,
    COALESCE(SUM(CASE WHEN created_at >= date_trunc('week', CURRENT_DATE) THEN xp_earned ELSE 0 END), 0) as weekly_xp,
    COALESCE(SUM(xp_earned), 0) as total_xp,
    0, -- Will be updated by rank calculation
    0, -- Will be updated by rank calculation
    NOW()
  FROM study_statistics
  WHERE created_at >= date_trunc('week', CURRENT_DATE)
  GROUP BY user_id
  ON CONFLICT (user_id) DO UPDATE SET
    weekly_xp = EXCLUDED.weekly_xp,
    total_xp = EXCLUDED.total_xp,
    updated_at = NOW();
    
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate ranks
CREATE OR REPLACE FUNCTION calculate_ranks()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate weekly ranks
  UPDATE user_rankings 
  SET weekly_rank = rank_subquery.rank
  FROM (
    SELECT user_id, RANK() OVER (ORDER BY weekly_xp DESC) as rank
    FROM user_rankings
    WHERE weekly_xp > 0
  ) as rank_subquery
  WHERE user_rankings.user_id = rank_subquery.user_id;
  
  -- Calculate all-time ranks
  UPDATE user_rankings 
  SET all_time_rank = rank_subquery.rank
  FROM (
    SELECT user_id, RANK() OVER (ORDER BY total_xp DESC) as rank
    FROM user_rankings
    WHERE total_xp > 0
  ) as rank_subquery
  WHERE user_rankings.user_id = rank_subquery.user_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic ranking updates
CREATE TRIGGER trigger_update_user_rankings
AFTER INSERT ON study_statistics
FOR EACH ROW
EXECUTE FUNCTION update_user_rankings();

CREATE TRIGGER trigger_calculate_ranks
AFTER INSERT OR UPDATE ON user_rankings
FOR EACH ROW
EXECUTE FUNCTION calculate_ranks();

-- Function to award achievements based on real progress
CREATE OR REPLACE FUNCTION check_and_award_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_thresholds RECORD;
BEGIN
  -- Check for streak achievements
  IF NEW.streak_days = 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id, achievement_name, achievement_description, category, progress_value, max_progress, is_unlocked, unlocked_at)
    VALUES (NEW.user_id, 'streak_7', 'Week Warrior', 'Studied for 7 days straight', 'streak', 100, 100, TRUE, NOW())
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  IF NEW.streak_days = 30 THEN
    INSERT INTO user_achievements (user_id, achievement_id, achievement_name, achievement_description, category, progress_value, max_progress, is_unlocked, unlocked_at)
    VALUES (NEW.user_id, 'streak_30', 'Month Master', 'Studied for 30 days straight', 'streak', 100, 100, TRUE, NOW())
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  -- Check for XP achievements
  IF NEW.total_xp >= 1000 THEN
    INSERT INTO user_achievements (user_id, achievement_id, achievement_name, achievement_description, category, progress_value, max_progress, is_unlocked, unlocked_at)
    VALUES (NEW.user_id, 'xp_1000', 'Knowledge Seeker', 'Earned 1000 total XP', 'study', 100, 100, TRUE, NOW())
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  -- Check for level achievements
  IF NEW.level >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_id, achievement_name, achievement_description, category, progress_value, max_progress, is_unlocked, unlocked_at)
    VALUES (NEW.user_id, 'level_5', 'Dedicated Learner', 'Reached level 5', 'study', 100, 100, TRUE, NOW())
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for achievement checking
CREATE TRIGGER trigger_check_achievements
AFTER INSERT OR UPDATE ON user_rankings
FOR EACH ROW
EXECUTE FUNCTION check_and_award_achievements();
