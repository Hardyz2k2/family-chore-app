-- Chore System V2: Daily habits, personal space, smart scheduling

-- Add new columns to chores table
ALTER TABLE chores ADD COLUMN IF NOT EXISTS chore_type VARCHAR(20) DEFAULT 'household'
  CHECK (chore_type IN ('daily_habit', 'household', 'routine', 'personal_space', 'laundry'));

ALTER TABLE chores ADD COLUMN IF NOT EXISTS time_of_day VARCHAR(20) DEFAULT 'anytime'
  CHECK (time_of_day IN ('morning', 'evening', 'anytime'));

ALTER TABLE chores ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 3;

ALTER TABLE chores ADD COLUMN IF NOT EXISTS owner_user_ids TEXT[]; -- array of user IDs for personal/shared room chores

-- Update frequency CHECK to include new values
ALTER TABLE chores DROP CONSTRAINT IF EXISTS chores_frequency_check;
ALTER TABLE chores ADD CONSTRAINT chores_frequency_check
  CHECK (frequency IN ('daily', 'daily_habit', 'weekly', 'monthly', 'fortnightly', 'on_schedule', 'once'));

-- Daily habit templates (pre-built, parents toggle on/off)
CREATE TABLE IF NOT EXISTS daily_habit_templates (
  template_id VARCHAR(50) PRIMARY KEY,
  habit_name VARCHAR(255) NOT NULL,
  time_of_day VARCHAR(20) NOT NULL CHECK (time_of_day IN ('morning', 'evening')),
  min_age INTEGER DEFAULT 3,
  points INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  description TEXT
);

-- Seed daily habit templates
INSERT INTO daily_habit_templates (template_id, habit_name, time_of_day, min_age, points, sort_order, description) VALUES
  ('make_bed', 'Make your bed', 'morning', 4, 1, 1, 'Make your bed neatly before leaving your room'),
  ('brush_teeth_am', 'Brush teeth', 'morning', 3, 1, 2, 'Brush your teeth for 2 minutes'),
  ('brush_teeth_pm', 'Brush teeth', 'evening', 3, 1, 1, 'Brush your teeth for 2 minutes before bed'),
  ('clear_plate', 'Clear your plate', 'evening', 4, 1, 2, 'Take your plate to the kitchen after eating'),
  ('clothes_in_basket', 'Clothes in laundry basket', 'evening', 4, 1, 3, 'Put dirty clothes in the laundry basket'),
  ('shower_bath', 'Shower / bath', 'evening', 6, 1, 4, 'Have your shower or bath')
ON CONFLICT (template_id) DO NOTHING;

-- Family daily habit config (which habits are active per family)
CREATE TABLE IF NOT EXISTS family_daily_habits (
  family_id UUID NOT NULL REFERENCES families(family_id),
  template_id VARCHAR(50) NOT NULL REFERENCES daily_habit_templates(template_id),
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (family_id, template_id)
);

-- Laundry config (stored in house_details JSONB, but we need an index)
-- laundry_days: ["monday", "thursday"]
-- laundry_rotation: "children" | "specific"

-- Room sharing config (stored in house_details JSONB)
-- shared_rooms: [{"room_name": "Kids Room", "children": ["user_id_1", "user_id_2"]}]
