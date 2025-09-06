-- Add status to people table
ALTER TABLE people ADD COLUMN status VARCHAR(50) DEFAULT 'New Lead' NOT NULL;
CREATE INDEX idx_people_status ON people(status);

-- Update demo data with statuses
UPDATE people SET status = 'Contacted' WHERE id IN (1, 3, 5);
UPDATE people SET status = 'Reply Received' WHERE id IN (2);
UPDATE people SET status = 'Closed' WHERE id IN (4);

-- Create pipelines table
CREATE TABLE pipelines (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Add a default pipeline for the demo company
INSERT INTO pipelines (id, company_id, name) VALUES (1, 1, 'Sales Pipeline');

-- Add pipeline_id to deal_stages
ALTER TABLE deal_stages ADD COLUMN pipeline_id BIGINT;

-- Update existing stages to belong to the default pipeline
UPDATE deal_stages SET pipeline_id = 1 WHERE company_id = 1;

-- Add NOT NULL constraint and foreign key
ALTER TABLE deal_stages ALTER COLUMN pipeline_id SET NOT NULL;
ALTER TABLE deal_stages ADD CONSTRAINT fk_pipeline FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE;

-- Create company email settings table
CREATE TABLE company_email_settings (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_user VARCHAR(255),
    smtp_password_secret_name VARCHAR(255),
    imap_host VARCHAR(255),
    imap_port INTEGER,
    imap_user VARCHAR(255),
    imap_password_secret_name VARCHAR(255)
);
