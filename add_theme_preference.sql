-- Add theme_preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN theme_preference TEXT CHECK (theme_preference IN ('light', 'dark', 'system')) DEFAULT 'system';

-- Update existing profiles to have system default
UPDATE profiles 
SET theme_preference = 'system' 
WHERE theme_preference IS NULL;
