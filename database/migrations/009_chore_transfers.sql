-- Track chore transfers and support requests
ALTER TABLE assigned_chores ADD COLUMN IF NOT EXISTS transferred_from UUID REFERENCES users(user_id);
ALTER TABLE assigned_chores ADD COLUMN IF NOT EXISTS transfer_type VARCHAR(10) CHECK (transfer_type IN ('transfer', 'support'));
ALTER TABLE assigned_chores ADD COLUMN IF NOT EXISTS original_points INTEGER;
