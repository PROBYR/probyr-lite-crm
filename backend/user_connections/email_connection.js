import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Connects a user's email account.
export const connectEmail = api({ expose: true, method: "POST", path: "/user-connections/email" }, async (req) => {
    try {
        // Check if user already has an email connection
        const existingConnection = await crmDB.queryRow `
        SELECT id FROM user_email_settings WHERE user_id = ${req.userId}
      `;
        if (existingConnection) {
            // Update existing connection
            await crmDB.exec `
          UPDATE user_email_settings 
          SET 
            provider = ${req.provider},
            email_address = ${req.emailAddress},
            oauth_access_token = ${req.oauthAccessToken || null},
            oauth_refresh_token = ${req.oauthRefreshToken || null},
            oauth_token_expires_at = ${req.oauthTokenExpiresAt || null},
            smtp_host = ${req.smtpHost || null},
            smtp_port = ${req.smtpPort || null},
            smtp_username = ${req.smtpUsername || null},
            smtp_password_encrypted = ${req.smtpPassword || null},
            imap_host = ${req.imapHost || null},
            imap_port = ${req.imapPort || null},
            imap_username = ${req.imapUsername || null},
            imap_password_encrypted = ${req.imapPassword || null},
            is_active = TRUE,
            updated_at = NOW()
          WHERE user_id = ${req.userId}
        `;
        }
        else {
            // Create new connection
            await crmDB.exec `
          INSERT INTO user_email_settings (
            user_id, provider, email_address, oauth_access_token, oauth_refresh_token, 
            oauth_token_expires_at, smtp_host, smtp_port, smtp_username, 
            smtp_password_encrypted, imap_host, imap_port, imap_username, 
            imap_password_encrypted, is_active, created_at, updated_at
          )
          VALUES (
            ${req.userId}, ${req.provider}, ${req.emailAddress}, ${req.oauthAccessToken || null}, 
            ${req.oauthRefreshToken || null}, ${req.oauthTokenExpiresAt || null},
            ${req.smtpHost || null}, ${req.smtpPort || null}, ${req.smtpUsername || null}, 
            ${req.smtpPassword || null}, ${req.imapHost || null}, ${req.imapPort || null}, 
            ${req.imapUsername || null}, ${req.imapPassword || null}, 
            TRUE, NOW(), NOW()
          )
        `;
        }
        // Fetch the updated/created connection
        const connection = await crmDB.queryRow `
        SELECT id, user_id, provider, email_address, is_active, created_at, updated_at
        FROM user_email_settings 
        WHERE user_id = ${req.userId}
      `;
        if (!connection) {
            throw new Error("Failed to create/update email connection");
        }
        return {
            id: connection.id,
            userId: connection.user_id,
            provider: connection.provider,
            emailAddress: connection.email_address,
            isActive: connection.is_active,
            createdAt: connection.created_at,
            updatedAt: connection.updated_at,
        };
    }
    catch (error) {
        console.error('Error in connectEmail:', error);
        throw error;
    }
});
//# sourceMappingURL=email_connection.js.map