-- Add assigned_to column to deals table for deal ownership
ALTER TABLE deals ADD COLUMN assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);

-- Update some demo deals with assigned owners
UPDATE deals SET assigned_to = 1 WHERE id IN (1, 3);
UPDATE deals SET assigned_to = 2 WHERE id IN (2, 4);
