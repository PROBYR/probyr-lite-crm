import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface CreateCompanyRequest {
  name: string;
  website?: string;
  industry?: string;
  address?: string;
  phone?: string;
}

export interface Company {
  id: number;
  name: string;
  website?: string;
  industry?: string;
  address?: string;
  phone?: string;
  bccEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new company.
export const createCompany = api<CreateCompanyRequest, Company>(
  { expose: true, method: "POST", path: "/companies" },
  async (req) => {
    try {
      // Generate a unique BCC email for the company
      const bccEmail = `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@inbound.probyr.example`;
      
      const companyRow = await crmDB.queryRow<{
        id: number;
        name: string;
        website: string | null;
        industry: string | null;
        address: string | null;
        phone: string | null;
        bcc_email: string;
        created_at: Date;
        updated_at: Date;
      }>`
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
    } catch (error) {
      console.error('Error in createCompany:', error);
      throw error;
    }
  }
);
