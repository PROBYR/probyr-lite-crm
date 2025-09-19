import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Deactivates one or more users by setting them to inactive.
export const deactivateUsers = api({ expose: true, method: "POST", path: "/users/deactivate" }, async ({ userIds }) => {
    try {
        if (userIds.length === 0) {
            return { deactivatedCount: 0, skippedCount: 0 };
        }
        // Prevent deactivating the main admin user (ID 1)
        const filteredUserIds = userIds.filter(id => id !== 1);
        const skippedCount = userIds.length - filteredUserIds.length;
        if (filteredUserIds.length === 0) {
            return { deactivatedCount: 0, skippedCount };
        }
        await crmDB.exec `
        UPDATE users 
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = ANY(${filteredUserIds})
      `;
        return {
            deactivatedCount: filteredUserIds.length,
            skippedCount,
        };
    }
    catch (error) {
        console.error('Error in deactivateUsers:', error);
        throw error;
    }
});
//# sourceMappingURL=deactivate_users.js.map