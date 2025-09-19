import { api } from "encore.dev/api";
import { crmDB } from "./db";
import { randomBytes } from "crypto";
// Creates a new API key with specific permissions for a company.
export const createApiKey = api({ expose: true, method: "POST", path: "/api-keys" }, async (req) => {
    try {
        // Generate a secure random API key
        const keyBytes = randomBytes(32);
        const fullKey = `pbr_${keyBytes.toString('hex')}`;
        const keyPrefix = fullKey.substring(0, 12) + '...';
        // Hash the key for storage (in a real implementation, use bcrypt or similar)
        const hashedKey = keyBytes.toString('base64');
        const apiKeyRow = await crmDB.queryRow `
        INSERT INTO api_keys (company_id, name, description, key_hash, key_prefix, permissions, is_active, created_at)
        VALUES (${req.companyId}, ${req.name}, ${req.description || null}, ${hashedKey}, ${keyPrefix}, ${JSON.stringify(req.permissions)}, TRUE, NOW())
        RETURNING id, company_id, name, description, key_prefix, permissions, is_active, created_at
      `;
        if (!apiKeyRow) {
            throw new Error("Failed to create API key");
        }
        return {
            apiKey: {
                id: apiKeyRow.id,
                companyId: apiKeyRow.company_id,
                name: apiKeyRow.name,
                description: apiKeyRow.description || undefined,
                keyPrefix: apiKeyRow.key_prefix,
                permissions: JSON.parse(apiKeyRow.permissions),
                isActive: apiKeyRow.is_active,
                createdAt: apiKeyRow.created_at,
            },
            fullKey, // Only returned once during creation
        };
    }
    catch (error) {
        console.error('Error in createApiKey:', error);
        throw error;
    }
});
//# sourceMappingURL=create_api_key.js.map