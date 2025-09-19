import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves a single company by ID.
export const getCompany = api({ expose: true, method: "GET", path: "/companies/:id" }, async (params) => {
    try {
        const company = await crmDB.queryRow `
        SELECT * FROM companies WHERE id = ${params.id}
      `;
        if (!company) {
            throw APIError.notFound("company not found");
        }
        return {
            id: company.id,
            name: company.name,
            website: company.website || undefined,
            phone: company.phone || undefined,
            address: company.address || undefined,
            bccEmail: company.bcc_email,
            createdAt: company.created_at,
            updatedAt: company.updated_at,
        };
    }
    catch (error) {
        console.error('Error in getCompany:', error);
        throw error;
    }
});
//# sourceMappingURL=get_company.js.map