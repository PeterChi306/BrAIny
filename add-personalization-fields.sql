-- Add personalization fields to profiles table
-- Run this in your Supabase SQL editor

-- Add missing personalization columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
    RAISE NOTICE 'Added display_name column to profiles table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
    ALTER TABLE profiles ADD COLUMN interests TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added interests column to profiles table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age') THEN
    ALTER TABLE profiles ADD COLUMN age INTEGER;
    RAISE NOTICE 'Added age column to profiles table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hobbies') THEN
    ALTER TABLE profiles ADD COLUMN hobbies TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added hobbies column to profiles table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'favorite_topics') THEN
    ALTER TABLE profiles ADD COLUMN favorite_topics TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added favorite_topics column to profiles table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_tone') THEN
    ALTER TABLE profiles ADD COLUMN preferred_tone TEXT DEFAULT 'friendly';
    RAISE NOTICE 'Added preferred_tone column to profiles table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'learning_pace') THEN
    ALTER TABLE profiles ADD COLUMN learning_pace TEXT DEFAULT 'moderate';
    RAISE NOTICE 'Added learning_pace column to profiles table';
  END IF;
END $$;

-- Update existing profiles with default values
UPDATE profiles 
SET 
  display_name = COALESCE(display_name, 'Student'),
  interests = COALESCE(interests, ARRAY['gaming', 'tech']),
  age = COALESCE(age, 16),
  hobbies = COALESCE(hobbies, ARRAY['reading', 'sports']),
  favorite_topics = COALESCE(favorite_topics, ARRAY['science', 'math']),
  preferred_tone = COALESCE(preferred_tone, 'friendly'),
  learning_pace = COALESCE(learning_pace, 'moderate')
WHERE display_name IS NULL OR interests IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('display_name', 'interests', 'age', 'hobbies', 'favorite_topics', 'preferred_tone', 'learning_pace')
ORDER BY column_name;
