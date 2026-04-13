-- Prevent duplicate chore assignments (same chore, same user, same day)
-- First remove any existing duplicates keeping only one
DELETE FROM assigned_chores a USING assigned_chores b
WHERE a.assigned_chore_id > b.assigned_chore_id
  AND a.chore_id = b.chore_id
  AND a.user_id = b.user_id
  AND a.due_date = b.due_date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assigned_chores_unique
  ON assigned_chores (chore_id, user_id, due_date);
