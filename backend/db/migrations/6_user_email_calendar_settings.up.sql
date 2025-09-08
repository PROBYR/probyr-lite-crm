-- User email and calendar connection settings
CREATE TABLE user_email_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'smtp'
    email_address VARCHAR(255) NOT NULL,
    
    -- OAuth settings (for Gmail/Outlook)
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- SMTP/IMAP settings (for generic providers)
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT,
    imap_host VARCHAR(255),
    imap_port INTEGER,
    imap_username VARCHAR(255),
    imap_password_encrypted TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_calendar_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'outlook', 'caldav'
    
    -- OAuth settings (for Google/Outlook)
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- CalDAV settings (for generic providers)
    caldav_url VARCHAR(500),
    caldav_username VARCHAR(255),
    caldav_password_encrypted TEXT,
    
    primary_calendar_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_email_settings_user_id ON user_email_settings(user_id);
CREATE INDEX idx_user_calendar_settings_user_id ON user_calendar_settings(user_id);
