-- Migration: Add child invitation system for children to claim their accounts
-- This allows parents to generate invitation links that children can use to set up their own login credentials

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create child_invitations table
CREATE TABLE IF NOT EXISTS child_invitations (
    invitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
    child_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    invitation_token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on invitation_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_child_invitations_token ON child_invitations(invitation_token);

-- Create index on child_user_id for finding invitations for a specific child
CREATE INDEX IF NOT EXISTS idx_child_invitations_child ON child_invitations(child_user_id);

-- Create index on family_id for listing all invitations for a family
CREATE INDEX IF NOT EXISTS idx_child_invitations_family ON child_invitations(family_id);

-- Add comment for documentation
COMMENT ON TABLE child_invitations IS 'Stores invitation tokens for children to claim their accounts and set up login credentials';
COMMENT ON COLUMN child_invitations.invitation_token IS 'Unique token used in the invitation URL (e.g., /join/abc123xyz)';
COMMENT ON COLUMN child_invitations.expires_at IS 'Token expires after 7 days by default';
COMMENT ON COLUMN child_invitations.claimed_at IS 'Timestamp when the child claimed the invitation and set up their password';
