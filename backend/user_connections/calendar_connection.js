import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Connects a user's calendar account.
export const connectCalendar = api({ expose: true, method: "POST", path: "/user-connections/calendar" }, async (req) => {
    try {
        // Check if user already has a calendar connection
        const existingConnection = await crmDB.queryRow `
        SELECT id FROM user_calendar_settings WHERE user_id = ${req.userId}
      `;
        if (existingConnection) {
            // Update existing connection
            await crmDB.exec `
          UPDATE user_calendar_settings 
          SET 
            provider = ${req.provider},
            oauth_access_token = ${req.oauthAccessToken || null},
            oauth_refresh_token = ${req.oauthRefreshToken || null},
            oauth_token_expires_at = ${req.oauthTokenExpiresAt || null},
            caldav_url = ${req.caldavUrl || null},
            caldav_username = ${req.caldavUsername || null},
            caldav_password_encrypted = ${req.caldavPassword || null},
            primary_calendar_id = ${req.primaryCalendarId || null},
            is_active = TRUE,
            updated_at = NOW()
          WHERE user_id = ${req.userId}
        `;
        }
        else {
            // Create new connection
            await crmDB.exec `
          INSERT INTO user_calendar_settings (
            user_id, provider, oauth_access_token, oauth_refresh_token, 
            oauth_token_expires_at, caldav_url, caldav_username, 
            caldav_password_encrypted, primary_calendar_id, is_active, 
            created_at, updated_at
          )
          VALUES (
            ${req.userId}, ${req.provider}, ${req.oauthAccessToken || null}, 
            ${req.oauthRefreshToken || null}, ${req.oauthTokenExpiresAt || null},
            ${req.caldavUrl || null}, ${req.caldavUsername || null}, 
            ${req.caldavPassword || null}, ${req.primaryCalendarId || null}, 
            TRUE, NOW(), NOW()
          )
        `;
        }
        // Fetch the updated/created connection
        const connection = await crmDB.queryRow `
        SELECT id, user_id, provider, primary_calendar_id, is_active, created_at, updated_at
        FROM user_calendar_settings 
        WHERE user_id = ${req.userId}
      `;
        if (!connection) {
            throw new Error("Failed to create/update calendar connection");
        }
        return {
            id: connection.id,
            userId: connection.user_id,
            provider: connection.provider,
            primaryCalendarId: connection.primary_calendar_id || undefined,
            isActive: connection.is_active,
            createdAt: connection.created_at,
            updatedAt: connection.updated_at,
        };
    }
    catch (error) {
        console.error('Error in connectCalendar:', error);
        throw error;
    }
});
//# sourceMappingURL=calendar_connection.js.map