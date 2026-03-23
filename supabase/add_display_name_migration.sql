-- Add display_name field to profiles table
ALTER TABLE profiles 
ADD COLUMN display_name TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Update existing profiles with a default display name based on email (optional)
-- UPDATE profiles 
-- SET display_name = SPLIT_PART(SPLIT_PART(email, '@', 1), '.', 1)
-- WHERE display_name IS NULL AND email IS NOT NULL;
