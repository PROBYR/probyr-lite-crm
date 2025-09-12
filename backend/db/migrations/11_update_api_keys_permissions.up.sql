-- Add permissions column to api_keys table
ALTER TABLE api_keys ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;

-- Update existing api keys with default permissions
UPDATE api_keys SET permissions = '["leads:create", "contacts:read"]'::jsonb WHERE permissions IS NULL;

-- Make permissions column not null
ALTER TABLE api_keys ALTER COLUMN permissions SET NOT NULL;

-- Create index for better performance on permissions queries
CREATE INDEX idx_api_keys_permissions ON api_keys USING GIN (permissions);
