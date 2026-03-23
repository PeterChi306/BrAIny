-- Update subscription tier constraint to include new tier names and Legend tier

-- First, drop the existing check constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

-- Add the updated constraint with new tier names including Legend
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_tier_check 
CHECK (tier IN ('starter', 'scholar', 'master', 'legend'));

-- Update any existing records with old tier names to new ones
UPDATE subscriptions SET tier = 'starter' WHERE tier = 'free';
UPDATE subscriptions SET tier = 'scholar' WHERE tier = 'pro';
-- 'master' stays the same

-- Add comment to document the change
COMMENT ON CONSTRAINT subscriptions_tier_check ON subscriptions IS 'Ensures subscription tier is one of: starter, scholar, master, legend';
