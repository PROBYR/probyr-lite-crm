import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves all companies.
export const listCompanies = api({ expose: true, method: "GET", path: "/companies" }, async () => {
    try {
        const rows = await crmDB.queryAll `SELECT * FROM companies ORDER BY name`;
        const companies = rows.map(row => ({
            id: row.id,
            name: row.name || '',
            website: row.website || undefined,
            phone: row.phone || undefined,
            address: row.address || undefined,
            bccEmail: row.bcc_email || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
        return { companies };
    }
    catch (error) {
        console.error('Error in listCompanies:', error);
        return { companies: [] };
    }
});
//# sourceMappingURL=list_companies.js.map