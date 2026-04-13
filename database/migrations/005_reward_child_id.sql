-- Add optional child_id to rewards so rewards can be per-child or family-wide (NULL = all children)
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES users(user_id) ON DELETE CASCADE;
