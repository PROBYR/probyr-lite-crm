import { api } from "encore.dev/api";
import { crmDB } from "./db";

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

export interface ListCompaniesResponse {
  companies: Company[];
}

// Retrieves all companies.
export const listCompanies = api<void, ListCompaniesResponse>(
  { expose: true, method: "GET", path: "/companies" },
  async () => {
    try {
      const rows = await crmDB.queryAll<{
        id: number;
        name: string;
        website: string | null;
        phone: string | null;
        address: string | null;
        bcc_email: string;
        created_at: Date;
        updated_at: Date;
      }>`SELECT * FROM companies ORDER BY name`;

      const companies: Company[] = rows.map(row => ({
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
    } catch (error) {
      console.error('Error in listCompanies:', error);
      return { companies: [] };
    }
  }
);
