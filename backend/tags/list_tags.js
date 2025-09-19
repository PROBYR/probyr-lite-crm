import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves all tags for a company.
export const listTags = api({ expose: true, method: "GET", path: "/tags" }, async (params) => {
    try {
        const companyId = params.companyId || 1; // Default to demo company
        const rows = await crmDB.queryAll `
        SELECT * FROM tags 
        WHERE company_id = ${companyId}
        ORDER BY name
      `;
        const tags = rows.map(row => ({
            id: row.id,
            companyId: row.company_id,
            name: row.name || '',
            color: row.color || '#3B82F6',
            createdAt: row.created_at,
        }));
        return { tags };
    }
    catch (error) {
        console.error('Error in listTags:', error);
        return { tags: [] };
    }
});
//# sourceMappingURL=list_tags.js.map