-- Add unique family code for joining families
ALTER TABLE families ADD COLUMN IF NOT EXISTS family_code VARCHAR(8) UNIQUE;

-- Generate codes for existing families
UPDATE families SET family_code = UPPER(SUBSTRING(MD5(family_id::text) FROM 1 FOR 6))
WHERE family_code IS NULL;
