import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Revokes an API key by setting it to inactive.
export const revokeApiKey = api({ expose: true, method: "DELETE", path: "/api-keys/:id" }, async (params) => {
    try {
        const result = await crmDB.exec `
        UPDATE api_keys 
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = ${params.id}
      `;
        // Note: In a real implementation, you might want to check if any rows were affected
    }
    catch (error) {
        console.error('Error in revokeApiKey:', error);
        throw error;
    }
});
//# sourceMappingURL=revoke_api_key.js.map