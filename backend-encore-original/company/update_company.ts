import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface UpdateCompanyParams {
  id: number;
}

export interface UpdateCompanyRequest {
  name?: string;
  website?: string;
  phone?: string;
  address?: string;
}

export interface Company {
  id: number;
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  bccEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

// Updates company information.
export const updateCompany = api<UpdateCompanyParams & UpdateCompanyRequest, Company>(
  { expose: true, method: "PUT", path: "/companies/:id" },
  async (req) => {
    try {
      // Check if company exists
      const existingCompany = await crmDB.queryRow<{ id: number }>`
        SELECT id FROM companies WHERE id = ${req.id}
      `;

      if (!existingCompany) {
        throw APIError.notFound("company not found");
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (req.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(req.name);
      }
      if (req.website !== undefined) {
        updates.push(`website = $${paramIndex++}`);
        values.push(req.website);
      }
      if (req.phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(req.phone);
      }
      if (req.address !== undefined) {
        updates.push(`address = $${paramIndex++}`);
        values.push(req.address);
      }

      updates.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      if (updates.length > 1) { // More than just updated_at
        values.push(req.id);
        const updateQuery = `
          UPDATE companies 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
        `;
        await crmDB.rawExec(updateQuery, ...values);
      }

      // Fetch updated company
      const updatedCompany = await crmDB.queryRow<{
        id: number;
        name: string;
        website: string | null;
        phone: string | null;
        address: string | null;
        bcc_email: string;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT * FROM companies WHERE id = ${req.id}
      `;

      if (!updatedCompany) {
        throw APIError.notFound("company not found");
      }

      return {
        id: updatedCompany.id,
        name: updatedCompany.name,
        website: updatedCompany.website || undefined,
        phone: updatedCompany.phone || undefined,
        address: updatedCompany.address || undefined,
        bccEmail: updatedCompany.bcc_email,
        createdAt: updatedCompany.created_at,
        updatedAt: updatedCompany.updated_at,
      };
    } catch (error) {
      console.error('Error in updateCompany:', error);
      throw error;
    }
  }
);
