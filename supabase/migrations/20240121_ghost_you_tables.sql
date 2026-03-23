-- Ghost-You Mode Tables for storing past reasoning and growth insights

-- Store user reasoning during learning sessions
CREATE TABLE IF NOT EXISTS ghost_you_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  user_reasoning TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  strategy_used TEXT,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
  time_spent INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store insights and growth moments
CREATE TABLE IF NOT EXISTS ghost_you_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('breakthrough', 'mistake', 'insight', 'struggle')),
  past_thinking TEXT,
  current_understanding TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revisit system for tracking concepts that need reinforcement
CREATE TABLE IF NOT EXISTS revisit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  reason TEXT NOT NULL,
  time_estimate INTEGER, -- in minutes
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('high', 'medium', 'low')),
  mistake_count INTEGER DEFAULT 1,
  hesitation_count INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart reminders system
CREATE TABLE IF NOT EXISTS smart_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('revisit', 'practice', 'deadline')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_sent BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional test/deadline calendar
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

-- Learning traits for personalization
CREATE TABLE IF NOT EXISTS learning_traits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trait_name TEXT NOT NULL,
  trait_description TEXT,
  is_confirmed BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trait_name)
);

-- Focus areas for each user (max 3)
CREATE TABLE IF NOT EXISTS focus_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  reason TEXT NOT NULL,
  time_to_fix INTEGER, -- in minutes
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ghost_you_entries_user_topic ON ghost_you_entries(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_ghost_you_entries_created_at ON ghost_you_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghost_you_insights_user_type ON ghost_you_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_ghost_you_insights_created_at ON ghost_you_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revisit_items_user_urgency ON revisit_items(user_id, urgency);
CREATE INDEX IF NOT EXISTS idx_revisit_items_updated_at ON revisit_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_reminders_user_scheduled ON smart_reminders(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_user_deadlines_user_date ON user_deadlines(user_id, deadline_date);
CREATE INDEX IF NOT EXISTS idx_learning_traits_user_confirmed ON learning_traits(user_id, is_confirmed);
CREATE INDEX IF NOT EXISTS idx_focus_areas_user_active ON focus_areas(user_id, is_active);

-- RLS (Row Level Security) policies
ALTER TABLE ghost_you_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_you_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_areas ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own ghost entries" ON ghost_you_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ghost entries" ON ghost_you_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ghost entries" ON ghost_you_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ghost entries" ON ghost_you_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON ghost_you_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON ghost_you_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights" ON ghost_you_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON ghost_you_insights FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own revisit items" ON revisit_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own revisit items" ON revisit_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own revisit items" ON revisit_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own revisit items" ON revisit_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reminders" ON smart_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON smart_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON smart_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON smart_reminders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own deadlines" ON user_deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deadlines" ON user_deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deadlines" ON user_deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deadlines" ON user_deadlines FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning traits" ON learning_traits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning traits" ON learning_traits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own learning traits" ON learning_traits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own learning traits" ON learning_traits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own focus areas" ON focus_areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own focus areas" ON focus_areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus areas" ON focus_areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus areas" ON focus_areas FOR DELETE USING (auth.uid() = user_id);

-- Function to limit focus areas to 3 per user
CREATE OR REPLACE FUNCTION limit_focus_areas()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Count existing active focus areas for this user
    IF (SELECT COUNT(*) FROM focus_areas WHERE user_id = NEW.user_id AND is_active = TRUE) >= 3 THEN
      RAISE EXCEPTION 'User cannot have more than 3 active focus areas';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce focus area limit
CREATE TRIGGER enforce_focus_area_limit
BEFORE INSERT ON focus_areas
FOR EACH ROW
EXECUTE FUNCTION limit_focus_areas();

-- Function to automatically create revisit items based on mistakes
CREATE OR REPLACE FUNCTION create_revisit_item_on_mistake()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a mistake
  IF NEW.user_answer != NEW.correct_answer THEN
    -- Check if revisit item already exists for this topic
    INSERT INTO revisit_items (user_id, topic, reason, time_estimate, urgency, mistake_count)
    VALUES (
      NEW.user_id,
      NEW.topic,
      'Incorrect answer detected: ' || LEFT(NEW.user_reasoning, 100),
      LEAST(NEW.time_spent / 60 + 2, 10), -- Estimate based on time spent + 2 minutes, max 10
      CASE 
        WHEN NEW.confidence_level >= 7 THEN 'high' -- High confidence but wrong = urgent
        ELSE 'medium'
      END,
      1
    )
    ON CONFLICT (user_id, topic) DO UPDATE SET
      mistake_count = revisit_items.mistake_count + 1,
      urgency = CASE 
        WHEN revisit_items.mistake_count >= 3 THEN 'high'
        WHEN revisit_items.mistake_count >= 2 THEN 'medium'
        ELSE 'low'
      END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create revisit items on mistakes
CREATE TRIGGER auto_create_revisit_item
AFTER INSERT ON ghost_you_entries
FOR EACH ROW
EXECUTE FUNCTION create_revisit_item_on_mistake();
