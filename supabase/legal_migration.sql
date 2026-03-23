-- Migration to add legal and privacy fields to profiles table
-- Also adds a function to handle account deletion

-- 1. Add legal fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS age INTEGER;

-- 2. Create a function to delete all user data
-- This is useful for the "Delete My Account" feature
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Delete from application tables (cascading normally handles some, but let's be explicit for safety)
    DELETE FROM chat_messages WHERE user_id = target_user_id;
    DELETE FROM chat_sessions WHERE user_id = target_user_id;
    DELETE FROM daily_usage WHERE user_id = target_user_id;
    DELETE FROM study_statistics WHERE user_id = target_user_id;
    DELETE FROM user_achievements WHERE user_id = target_user_id;
    DELETE FROM user_rankings WHERE user_id = target_user_id;
    DELETE FROM activity_feed WHERE user_id = target_user_id;
    DELETE FROM smart_reminders WHERE user_id = target_user_id;
    DELETE FROM user_connections WHERE requester_id = target_user_id OR addressee_id = target_user_id;
    
    -- Finally delete the profile
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Note: The auth.users record must be deleted via Supabase Admin API or by the user themselves if allowed.
    -- This function handles the application-level data.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
