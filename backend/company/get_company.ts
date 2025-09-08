import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface GetCompanyParams {
  id: number;
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

// Retrieves a single company by ID.
export const getCompany = api<GetCompanyParams, Company>(
  { expose: true, method: "GET", path: "/companies/:id" },
  async (params) => {
    try {
      const company = await crmDB.queryRow<{
        id: number;
        name: string;
        website: string | null;
        phone: string | null;
        address: string | null;
        bcc_email: string;
        created_at: Date;
        updated_at: Date;
      }>`
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
    } catch (error) {
      console.error('Error in getCompany:', error);
      throw error;
    }
  }
);
