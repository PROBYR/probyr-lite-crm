import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves a user's email signature.
export const getEmailSignature = api({ expose: true, method: "GET", path: "/users/:userId/email-signature" }, async (params) => {
    try {
        const user = await crmDB.queryRow `
        SELECT email_signature FROM users WHERE id = ${params.userId}
      `;
        if (!user) {
            throw APIError.notFound("user not found");
        }
        return {
            signature: user.email_signature || '',
        };
    }
    catch (error) {
        console.error('Error in getEmailSignature:', error);
        throw error;
    }
});
//# sourceMappingURL=get_email_signature.js.map