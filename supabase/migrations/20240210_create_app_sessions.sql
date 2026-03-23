-- Create app_sessions table for tracking actual time spent in app
CREATE TABLE IF NOT EXISTS app_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  session_type TEXT DEFAULT 'app_usage' CHECK (session_type IN ('app_usage', 'learning', 'gaming')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_date ON app_sessions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_app_sessions_active ON app_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_app_sessions_type ON app_sessions(session_type);

-- Enable Row Level Security
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own app sessions
CREATE POLICY "Users can view own app sessions" ON app_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own app sessions" ON app_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own app sessions" ON app_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own app sessions" ON app_sessions FOR DELETE USING (auth.uid() = user_id);
