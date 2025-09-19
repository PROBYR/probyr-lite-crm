import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Creates a new company.
export const createCompany = api({ expose: true, method: "POST", path: "/companies" }, async (req) => {
    try {
        // Generate a unique BCC email for the company
        const bccEmail = `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@inbound.probyr.example`;
        const companyRow = await crmDB.queryRow `
        INSERT INTO companies (name, website, industry, address, phone, bcc_email, created_at, updated_at)
        VALUES (${req.name}, ${req.website || null}, ${req.industry || null}, ${req.address || null}, ${req.phone || null}, ${bccEmail}, NOW(), NOW())
        RETURNING *
      `;
        if (!companyRow) {
            throw new Error("Failed to create company");
        }
        return {
            id: companyRow.id,
            name: companyRow.name,
            website: companyRow.website || undefined,
            industry: companyRow.industry || undefined,
            address: companyRow.address || undefined,
            phone: companyRow.phone || undefined,
            bccEmail: companyRow.bcc_email,
            createdAt: companyRow.created_at,
            updatedAt: companyRow.updated_at,
        };
    }
    catch (error) {
        console.error('Error in createCompany:', error);
        throw error;
    }
});
//# sourceMappingURL=create_company.js.map