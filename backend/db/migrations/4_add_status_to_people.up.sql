ALTER TABLE people ADD COLUMN status VARCHAR(50) DEFAULT 'New Lead' NOT NULL;
CREATE INDEX idx_people_status ON people(status);

-- For demo data, let's assign some statuses
UPDATE people SET status = 'Contacted' WHERE id IN (1, 3, 5);
UPDATE people SET status = 'Reply Received' WHERE id IN (2);
UPDATE people SET status = 'Closed' WHERE id IN (4);
