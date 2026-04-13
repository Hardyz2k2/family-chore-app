-- Add short invite codes to child_invitations
ALTER TABLE child_invitations ADD COLUMN IF NOT EXISTS invite_code VARCHAR(6) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_invite_code ON child_invitations(invite_code);
