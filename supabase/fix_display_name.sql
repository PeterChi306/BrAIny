-- Add display_name field to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'display_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN display_name TEXT;
        
        -- Add index for better performance
        CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
        
        RAISE NOTICE 'display_name column added to profiles table';
    ELSE
        RAISE NOTICE 'display_name column already exists in profiles table';
    END IF;
END $$;
