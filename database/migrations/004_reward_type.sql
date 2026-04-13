-- Add reward_type column to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS reward_type VARCHAR(20) DEFAULT 'daily'
  CHECK (reward_type IN ('daily', 'weekly', 'family_target'));
