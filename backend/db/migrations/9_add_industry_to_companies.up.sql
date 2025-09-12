-- Add industry field to companies table
ALTER TABLE companies ADD COLUMN industry VARCHAR(255);

-- Update demo company with some sample data
UPDATE companies SET industry = 'Technology' WHERE id = 1;
