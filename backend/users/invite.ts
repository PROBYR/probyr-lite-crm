import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface InviteUserRequest {
  companyId: number;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'member';
}

export interface InviteUserResponse {
  success: boolean;
  userId: number;
}

// Invites a new user to a company.
export const inviteUser = api<InviteUserRequest, InviteUserResponse>(
  { expose: true, method: "POST", path: "/users/invite" },
  async (req) => {
    // In a real app, you'd also send an invitation email.
    const userRow = await crmDB.queryRow<{ id: number }>`
      INSERT INTO users (company_id, email, first_name, last_name, role, is_active)
      VALUES (${req.companyId}, ${req.email}, ${req.firstName}, ${req.lastName || null}, ${req.role}, FALSE)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    if (!userRow) {
      // User might already exist. We can decide if this is an error or not.
      // For now, we'll consider it a soft success.
      const existing = await crmDB.queryRow<{ id: number }>`SELECT id FROM users WHERE email = ${req.email}`;
      return { success: true, userId: existing!.id };
    }

    return { success: true, userId: userRow.id };
  }
);
