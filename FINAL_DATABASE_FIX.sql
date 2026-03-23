-- FINAL FIX: Update subscription tier constraint to include Legend tier
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing constraint that's blocking Legend tier
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

-- Step 2: Add the new constraint with all tier names including Legend
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_tier_check 
CHECK (tier IN ('starter', 'scholar', 'master', 'legend'));

-- Step 3: Update any existing records with old tier names
UPDATE subscriptions SET tier = 'starter' WHERE tier = 'free';
UPDATE subscriptions SET tier = 'scholar' WHERE tier = 'pro';

-- Step 4: Verify the fix (optional)
SELECT 
    table_name, 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc 
    ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'subscriptions';
