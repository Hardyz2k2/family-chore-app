-- Add contract/entrepreneurship features to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pitch_reason TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS proposed_price DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Add counter-offer fields to job_applications
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS counter_amount DECIMAL(10,2);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS counter_message TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS negotiation_round INTEGER DEFAULT 0;
