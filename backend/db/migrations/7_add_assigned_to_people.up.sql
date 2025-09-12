-- Add assigned_to column to people table for owner assignment
ALTER TABLE people ADD COLUMN assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_people_assigned_to ON people(assigned_to);

-- Update some demo data with assigned owners
UPDATE people SET assigned_to = 1 WHERE id IN (1, 3);
UPDATE people SET assigned_to = 2 WHERE id IN (2, 4);
