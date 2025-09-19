import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
// Updates a user's email signature.
export const updateEmailSignature = api({ expose: true, method: "PUT", path: "/users/:userId/email-signature" }, async (req) => {
    try {
        // Check if user exists
        const existingUser = await crmDB.queryRow `
        SELECT id FROM users WHERE id = ${req.userId}
      `;
        if (!existingUser) {
            throw APIError.notFound("user not found");
        }
        await crmDB.exec `
        UPDATE users 
        SET email_signature = ${req.signature}, updated_at = NOW()
        WHERE id = ${req.userId}
      `;
    }
    catch (error) {
        console.error('Error in updateEmailSignature:', error);
        throw error;
    }
});
//# sourceMappingURL=update_email_signature.js.map