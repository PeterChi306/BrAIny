-- SQL Command to disable the redundant streak trigger
-- Run this in the Supabase SQL Editor

DROP TRIGGER IF EXISTS update_study_streak_trigger ON daily_usage;
DROP FUNCTION IF EXISTS public.update_study_streak();
