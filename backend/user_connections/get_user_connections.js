import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves a user's email and calendar connections.
export const getUserConnections = api({ expose: true, method: "GET", path: "/user-connections/:userId" }, async (params) => {
    try {
        const emailConnection = await crmDB.queryRow `
        SELECT id, provider, email_address, is_active
        FROM user_email_settings 
        WHERE user_id = ${params.userId} AND is_active = TRUE
      `;
        const calendarConnection = await crmDB.queryRow `
        SELECT id, provider, primary_calendar_id, is_active
        FROM user_calendar_settings 
        WHERE user_id = ${params.userId} AND is_active = TRUE
      `;
        const result = {};
        if (emailConnection) {
            result.email = {
                id: emailConnection.id,
                provider: emailConnection.provider,
                emailAddress: emailConnection.email_address,
                isActive: emailConnection.is_active,
            };
        }
        if (calendarConnection) {
            result.calendar = {
                id: calendarConnection.id,
                provider: calendarConnection.provider,
                primaryCalendarId: calendarConnection.primary_calendar_id || undefined,
                isActive: calendarConnection.is_active,
            };
        }
        return result;
    }
    catch (error) {
        console.error('Error in getUserConnections:', error);
        return {};
    }
});
//# sourceMappingURL=get_user_connections.js.map