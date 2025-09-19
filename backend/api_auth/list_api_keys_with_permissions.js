import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves all API keys with permissions for a company.
export const listApiKeysWithPermissions = api({ expose: true, method: "GET", path: "/api-keys/detailed" }, async (params) => {
    try {
        const companyId = params.companyId || 1; // Default to demo company
        const rows = await crmDB.queryAll `
        SELECT id, company_id, name, description, key_prefix, permissions, is_active, created_at
        FROM api_keys 
        WHERE company_id = ${companyId}
        ORDER BY created_at DESC
      `;
        const apiKeys = rows.map(row => ({
            id: row.id,
            companyId: row.company_id,
            name: row.name || '',
            description: row.description || undefined,
            keyPrefix: row.key_prefix || '',
            permissions: JSON.parse(row.permissions || '[]'),
            isActive: row.is_active,
            createdAt: row.created_at,
        }));
        return { apiKeys };
    }
    catch (error) {
        console.error('Error in listApiKeysWithPermissions:', error);
        return { apiKeys: [] };
    }
});
//# sourceMappingURL=list_api_keys_with_permissions.js.map