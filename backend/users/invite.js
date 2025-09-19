import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Invites a new user to a company.
export const inviteUser = api({ expose: true, method: "POST", path: "/users/invite" }, async (req) => {
    // In a real app, you'd also send an invitation email.
    const userRow = await crmDB.queryRow `
      INSERT INTO users (company_id, email, first_name, last_name, role, is_active)
      VALUES (${req.companyId}, ${req.email}, ${req.firstName}, ${req.lastName || null}, ${req.role}, FALSE)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    if (!userRow) {
        // User might already exist. We can decide if this is an error or not.
        // For now, we'll consider it a soft success.
        const existing = await crmDB.queryRow `SELECT id FROM users WHERE email = ${req.email}`;
        return { success: true, userId: existing.id };
    }
    return { success: true, userId: userRow.id };
});
//# sourceMappingURL=invite.js.map