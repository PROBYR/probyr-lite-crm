import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Deletes one or more users.
export const deleteUsers = api({ expose: true, method: "POST", path: "/users/delete" }, async ({ userIds }) => {
    if (userIds.length === 0) {
        return;
    }
    // Prevent deleting the main admin user (ID 1)
    const filteredUserIds = userIds.filter(id => id !== 1);
    if (filteredUserIds.length === 0) {
        return;
    }
    await crmDB.exec `
      DELETE FROM users WHERE id = ANY(${filteredUserIds})
    `;
});
//# sourceMappingURL=delete_users.js.map