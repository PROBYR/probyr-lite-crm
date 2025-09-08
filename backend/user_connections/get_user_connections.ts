import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface GetUserConnectionsParams {
  userId: number;
}

export interface UserConnections {
  email?: {
    id: number;
    provider: string;
    emailAddress: string;
    isActive: boolean;
  };
  calendar?: {
    id: number;
    provider: string;
    primaryCalendarId?: string;
    isActive: boolean;
  };
}

// Retrieves a user's email and calendar connections.
export const getUserConnections = api<GetUserConnectionsParams, UserConnections>(
  { expose: true, method: "GET", path: "/user-connections/:userId" },
  async (params) => {
    try {
      const emailConnection = await crmDB.queryRow<{
        id: number;
        provider: string;
        email_address: string;
        is_active: boolean;
      }>`
        SELECT id, provider, email_address, is_active
        FROM user_email_settings 
        WHERE user_id = ${params.userId} AND is_active = TRUE
      `;

      const calendarConnection = await crmDB.queryRow<{
        id: number;
        provider: string;
        primary_calendar_id: string | null;
        is_active: boolean;
      }>`
        SELECT id, provider, primary_calendar_id, is_active
        FROM user_calendar_settings 
        WHERE user_id = ${params.userId} AND is_active = TRUE
      `;

      const result: UserConnections = {};

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
    } catch (error) {
      console.error('Error in getUserConnections:', error);
      return {};
    }
  }
);
