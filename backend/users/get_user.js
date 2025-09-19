import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves a single user by ID.
export const getUser = api({ expose: true, method: "GET", path: "/users/:id" }, async (params) => {
    try {
        const user = await crmDB.queryRow `
        SELECT * FROM users WHERE id = ${params.id}
      `;
        if (!user) {
            throw APIError.notFound("user not found");
        }
        return {
            id: user.id,
            companyId: user.company_id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name || undefined,
            role: user.role,
            isActive: user.is_active,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
    }
    catch (error) {
        console.error('Error in getUser:', error);
        throw error;
    }
});
//# sourceMappingURL=get_user.js.map