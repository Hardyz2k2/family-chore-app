-- Seed data for development and testing

-- Insert sample default chores that can be copied to families
CREATE TABLE IF NOT EXISTS default_chores (
    chore_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chore_name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    points INTEGER NOT NULL,
    room_type VARCHAR(100),
    min_age INTEGER DEFAULT 4
);

-- Kitchen chores
INSERT INTO default_chores (chore_name, description, frequency, difficulty, points, room_type, min_age) VALUES
('Set the table', 'Place plates, cups, and utensils for meals', 'daily', 'easy', 10, 'kitchen', 5),
('Clear the table', 'Remove dishes after meals and wipe down', 'daily', 'easy', 10, 'kitchen', 5),
('Load dishwasher', 'Load dirty dishes into the dishwasher properly', 'daily', 'medium', 15, 'kitchen', 8),
('Unload dishwasher', 'Put clean dishes away in their proper places', 'daily', 'medium', 15, 'kitchen', 7),
('Wipe counters', 'Clean kitchen counters with a damp cloth', 'daily', 'easy', 10, 'kitchen', 6),
('Take out trash', 'Empty kitchen trash and replace bag', 'daily', 'medium', 15, 'kitchen', 8),
('Sweep floor', 'Sweep the kitchen floor', 'daily', 'medium', 15, 'kitchen', 8);

-- Bedroom chores
INSERT INTO default_chores (chore_name, description, frequency, difficulty, points, room_type, min_age) VALUES
('Make bed', 'Make your bed neatly each morning', 'daily', 'easy', 10, 'bedroom', 4),
('Put away clothes', 'Fold and put away clean laundry', 'weekly', 'easy', 10, 'bedroom', 5),
('Tidy room', 'Put toys and items in their proper places', 'daily', 'easy', 10, 'bedroom', 5),
('Change sheets', 'Remove old sheets and put on fresh ones', 'weekly', 'medium', 20, 'bedroom', 10),
('Vacuum room', 'Vacuum bedroom carpet or floor', 'weekly', 'medium', 20, 'bedroom', 9);

-- Bathroom chores
INSERT INTO default_chores (chore_name, description, frequency, difficulty, points, room_type, min_age) VALUES
('Wipe bathroom counter', 'Clean the bathroom counter and sink', 'weekly', 'easy', 15, 'bathroom', 7),
('Clean toilet', 'Scrub and sanitize the toilet', 'weekly', 'hard', 25, 'bathroom', 12),
('Clean bathtub', 'Scrub the bathtub or shower', 'weekly', 'hard', 25, 'bathroom', 12),
('Put away toiletries', 'Organize bathroom items neatly', 'daily', 'easy', 5, 'bathroom', 6);

-- Living room chores
INSERT INTO default_chores (chore_name, description, frequency, difficulty, points, room_type, min_age) VALUES
('Dust furniture', 'Dust tables, shelves, and surfaces', 'weekly', 'easy', 15, 'living_room', 7),
('Vacuum living room', 'Vacuum the living room carpet or floor', 'weekly', 'medium', 20, 'living_room', 9),
('Organize toys', 'Put toys back in toy box or storage', 'daily', 'easy', 10, 'living_room', 4),
('Fluff pillows', 'Arrange and fluff couch pillows', 'daily', 'easy', 5, 'living_room', 5);

-- Outdoor chores
INSERT INTO default_chores (chore_name, description, frequency, difficulty, points, room_type, min_age) VALUES
('Water plants', 'Water indoor and outdoor plants', 'weekly', 'easy', 10, 'outdoor', 5),
('Pick up yard', 'Collect toys and debris from the yard', 'weekly', 'easy', 15, 'outdoor', 6),
('Help with gardening', 'Assist with weeding and planting', 'weekly', 'medium', 20, 'outdoor', 8),
('Sweep porch', 'Sweep the front or back porch', 'weekly', 'medium', 15, 'outdoor', 8);

-- Pet chores
INSERT INTO default_chores (chore_name, description, frequency, difficulty, points, room_type, min_age) VALUES
('Feed pet', 'Give pet food and fresh water', 'daily', 'easy', 10, 'general', 6),
('Walk dog', 'Take the dog for a walk (with supervision)', 'daily', 'medium', 20, 'outdoor', 10),
('Clean litter box', 'Scoop and maintain cat litter box', 'daily', 'medium', 15, 'general', 10),
('Brush pet', 'Brush and groom the pet', 'weekly', 'easy', 15, 'general', 7);

-- Laundry chores
INSERT INTO default_chores (chore_name, description, frequency, difficulty, points, room_type, min_age) VALUES
('Sort laundry', 'Separate clothes by color and type', 'weekly', 'easy', 10, 'laundry', 7),
('Fold laundry', 'Fold clean clothes neatly', 'weekly', 'medium', 15, 'laundry', 8),
('Put away laundry', 'Put folded clothes in drawers and closets', 'weekly', 'easy', 10, 'laundry', 6),
('Start laundry', 'Load and start the washing machine', 'weekly', 'hard', 20, 'laundry', 12);

-- Sample default rewards
CREATE TABLE IF NOT EXISTS default_rewards (
    reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_name VARCHAR(255) NOT NULL,
    description TEXT,
    point_cost INTEGER NOT NULL
);

INSERT INTO default_rewards (reward_name, description, point_cost) VALUES
('30 min extra screen time', 'Get an extra 30 minutes of tablet or TV time', 50),
('1 hour extra screen time', 'Get an extra hour of tablet or TV time', 100),
('Choose dinner menu', 'Pick what the family has for dinner', 75),
('Stay up 30 min late', 'Stay up 30 minutes past bedtime on a weekend', 100),
('Movie night pick', 'Choose the movie for family movie night', 60),
('Small toy or treat', 'Earn a small toy or special treat', 150),
('Day without chores', 'Take a day off from chores', 200),
('Special outing', 'Go on a special outing of your choice', 300),
('Friend sleepover', 'Have a friend sleep over', 250),
('$5 allowance bonus', 'Get an extra $5 added to allowance', 200);
