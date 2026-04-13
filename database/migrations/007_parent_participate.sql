-- Add participate_in_chores flag for parents
ALTER TABLE users ADD COLUMN IF NOT EXISTS participate_in_chores BOOLEAN DEFAULT false;
