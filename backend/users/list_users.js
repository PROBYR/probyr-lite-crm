import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves all users for a company.
export const listUsers = api({
    expose: true,
    method: "GET",
    path: "/users"
}, async () => {
    try {
        const rows = await crmDB.queryAll `
      SELECT id, company_id, email, first_name, last_name, role, is_active, created_at
      FROM users 
      ORDER BY first_name, last_name
    `;
        const users = rows.map(row => ({
            id: row.id,
            companyId: row.company_id,
            email: row.email || '',
            firstName: row.first_name || '',
            lastName: row.last_name || undefined,
            role: row.role,
            isActive: row.is_active,
            createdAt: row.created_at,
        }));
        return { users };
    }
    catch (error) {
        console.error('Error in listUsers:', error);
        return { users: [] };
    }
});
//# sourceMappingURL=list_users.js.map