import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Deletes multiple contacts.
export const deleteContacts = api({ expose: true, method: "POST", path: "/people/delete-contacts" }, async (req) => {
    try {
        if (req.personIds.length === 0) {
            return { deletedCount: 0 };
        }
        // Delete all selected contacts
        await crmDB.exec `
        DELETE FROM people 
        WHERE id = ANY(${req.personIds})
      `;
        return { deletedCount: req.personIds.length };
    }
    catch (error) {
        console.error('Error in deleteContacts:', error);
        throw error;
    }
});
//# sourceMappingURL=delete_contacts.js.map