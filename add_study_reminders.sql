-- Add study reminder fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS study_reminders_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS study_time TIME DEFAULT '19:00',
ADD COLUMN IF NOT EXISTS study_days INTEGER[] DEFAULT '{1,2,3,4,5}',
ADD COLUMN IF NOT EXISTS reminder_preference TEXT DEFAULT 'notification';

-- Create study reminders table
CREATE TABLE IF NOT EXISTS study_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique reminder per user per day
  UNIQUE(user_id, day_of_week)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_reminders_user_id ON study_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_study_reminders_enabled ON study_reminders(is_enabled);
CREATE INDEX IF NOT EXISTS idx_study_reminders_time_day ON study_reminders(reminder_time, day_of_week);

-- Add notifications table for backup and tracking
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'deadline', 'study_reminder', 'streak_reminder'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate notifications
  UNIQUE(user_id, reminder_type, scheduled_for)
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(reminder_type);

-- Add RLS policies for study reminders
ALTER TABLE study_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study reminders" ON study_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study reminders" ON study_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study reminders" ON study_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study reminders" ON study_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for study reminders updated_at
CREATE TRIGGER update_study_reminders_updated_at 
  BEFORE UPDATE ON study_reminders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create API endpoint for checking reminders (this would be called by a cron job)
CREATE OR REPLACE FUNCTION check_study_reminders()
RETURNS TABLE(user_id UUID, message TEXT) AS $$
DECLARE
  reminder_record RECORD;
BEGIN
  FOR reminder_record IN 
    SELECT sr.*, p.display_name
    FROM study_reminders sr
    JOIN profiles p ON sr.user_id = p.id
    WHERE 
      sr.is_enabled = TRUE
      AND sr.day_of_week = EXTRACT(DOW FROM NOW())::INTEGER
      AND sr.reminder_time = TO_CHAR(NOW(), 'HH24:MI')
      AND p.study_reminders_enabled = TRUE
      AND (sr.last_sent IS NULL OR sr.last_sent < CURRENT_DATE)
  LOOP
    -- Update last sent
    UPDATE study_reminders 
    SET last_sent = NOW() 
    WHERE id = reminder_record.id;
    
    -- Return the notification data
    user_id := reminder_record.user_id;
    message := format('Study Time! 📚 - Hi %s!', COALESCE(reminder_record.display_name, 'Student'));
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
