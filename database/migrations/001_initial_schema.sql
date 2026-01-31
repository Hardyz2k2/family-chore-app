-- Family Chore Management App - Initial Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- FAMILIES table
CREATE TABLE IF NOT EXISTS families (
    family_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_name VARCHAR(255) NOT NULL,
    house_type VARCHAR(100),
    house_details JSONB,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- USERS table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'child')),
    family_id UUID REFERENCES families(family_id) ON DELETE SET NULL,
    age INTEGER,
    emoji VARCHAR(10),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for created_by in families
ALTER TABLE families
ADD CONSTRAINT fk_families_created_by
FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- FAMILY_MEMBERS junction table
CREATE TABLE IF NOT EXISTS family_members (
    family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'child')),
    nickname VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (family_id, user_id)
);

-- CHORES master table
CREATE TABLE IF NOT EXISTS chores (
    chore_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
    chore_name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'once')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points INTEGER NOT NULL DEFAULT 10,
    room_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ASSIGNED_CHORES table
CREATE TABLE IF NOT EXISTS assigned_chores (
    assigned_chore_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chore_id UUID NOT NULL REFERENCES chores(chore_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected')),
    proof_image_url TEXT,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- REWARDS table
CREATE TABLE IF NOT EXISTS rewards (
    reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
    reward_name VARCHAR(255) NOT NULL,
    description TEXT,
    point_cost INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- USER_REWARDS table (redemption history)
CREATE TABLE IF NOT EXISTS user_rewards (
    user_reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(reward_id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    fulfilled_by UUID REFERENCES users(user_id)
);

-- SCREEN_TIME_SETTINGS table
CREATE TABLE IF NOT EXISTS screen_time_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    daily_limit_minutes INTEGER NOT NULL DEFAULT 120,
    must_complete_daily_chores BOOLEAN DEFAULT true,
    minimum_points_required INTEGER DEFAULT 0,
    restricted_apps JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- POINTS_HISTORY table (for tracking point transactions)
CREATE TABLE IF NOT EXISTS points_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_chores_family_id ON chores(family_id);
CREATE INDEX IF NOT EXISTS idx_assigned_chores_user_id ON assigned_chores(user_id);
CREATE INDEX IF NOT EXISTS idx_assigned_chores_status ON assigned_chores(status);
CREATE INDEX IF NOT EXISTS idx_assigned_chores_due_date ON assigned_chores(due_date);
CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON chores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assigned_chores_updated_at BEFORE UPDATE ON assigned_chores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screen_time_settings_updated_at BEFORE UPDATE ON screen_time_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
