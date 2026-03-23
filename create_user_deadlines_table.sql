-- Create user_deadlines table for calendar events
CREATE TABLE IF NOT EXISTS user_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subject TEXT,
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high')),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_deadlines_user_date ON user_deadlines(user_id, deadline_date);

-- Enable Row Level Security
ALTER TABLE user_deadlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own deadlines
CREATE POLICY "Users can view own deadlines" ON user_deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deadlines" ON user_deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deadlines" ON user_deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deadlines" ON user_deadlines FOR DELETE USING (auth.uid() = user_id);
