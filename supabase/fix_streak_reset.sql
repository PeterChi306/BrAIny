-- Fix streak logic to properly reset when days are skipped
-- This replaces the existing trigger with improved logic

DROP TRIGGER IF EXISTS update_study_streak_trigger ON daily_usage;
DROP FUNCTION IF EXISTS public.update_study_streak();

CREATE OR REPLACE FUNCTION public.update_study_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Update study streak when daily_usage is updated
  IF TG_TABLE_NAME = 'daily_usage' THEN
    -- Check if this is the first activity today
    IF NEW.ai_messages_count > 0 OR NEW.scans_count > 0 THEN
      -- Get the most recent activity date before today
      WITH last_activity AS (
        SELECT MAX(du.date) as last_date
        FROM daily_usage du
        WHERE du.user_id = NEW.user_id 
        AND du.date < NEW.date
        AND (du.ai_messages_count > 0 OR du.scans_count > 0)
      )
      UPDATE profiles 
      SET study_streak = CASE 
        -- If last activity was exactly yesterday, increment streak
        WHEN last_activity.last_date = NEW.date - INTERVAL '1 day' THEN 
          COALESCE(study_streak, 0) + 1
        -- If last activity was more than 1 day ago or no previous activity, reset to 1
        WHEN last_activity.last_date < NEW.date - INTERVAL '1 day' OR last_activity.last_date IS NULL THEN 
          1
        -- Otherwise keep current streak (shouldn't happen)
        ELSE 
          COALESCE(study_streak, 1)
      END
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER update_study_streak_trigger
AFTER INSERT OR UPDATE ON daily_usage
FOR EACH ROW EXECUTE FUNCTION public.update_study_streak();
