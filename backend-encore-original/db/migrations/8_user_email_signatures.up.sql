-- Add email signature field to users table
ALTER TABLE users ADD COLUMN email_signature TEXT;

-- Update demo users with basic signatures
UPDATE users SET email_signature = 'Best regards,<br>' || first_name || ' ' || COALESCE(last_name, '') || '<br>Demo Company' WHERE company_id = 1;
