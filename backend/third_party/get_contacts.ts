import { api, APIError, Header } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";
import { api_auth } from "~encore/clients";

export interface Contact {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  status: string;
  company?: {
    id: number;
    name: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GetContactsParams {
  authorization: Header<"Authorization">;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface GetContactsResponse {
  contacts: Contact[];
  total: number;
}

// Retrieves contacts for third-party applications with proper permission validation.
export const getContacts = api<GetContactsParams, GetContactsResponse>(
  { expose: true, method: "GET", path: "/api/v1/contacts" },
  async (req) => {
    try {
      // Validate API key and check permissions
      if (!req.authorization || !req.authorization.startsWith('Bearer ')) {
        throw APIError.unauthenticated("API key required");
      }

      const apiKey = req.authorization.replace('Bearer ', '');
      
      const validation = await api_auth.validateApiKeyWithPermissions({
        key: apiKey,
      });

      if (!validation.isValid) {
        throw APIError.unauthenticated("Invalid API key");
      }

      if (!validation.permissions?.includes('contacts:read')) {
        throw APIError.permissionDenied("API key does not have contacts:read permission");
      }

      const companyId = validation.companyId!;
      const limit = req.limit || 50;
      const offset = req.offset || 0;

      // Get contacts for the authenticated company
      const query = `
        SELECT 
          p.id,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          p.job_title,
          p.status,
          p.created_at,
          p.updated_at,
          c.id as company_id,
          c.name as company_name,
          c.website as company_website
        FROM people p
        LEFT JOIN companies c ON p.company_id = c.id
        WHERE c.id IN (SELECT id FROM companies WHERE id = $1)
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const rows = await crmDB.rawQueryAll<{
        id: number;
        first_name: string;
        last_name: string | null;
        email: string | null;
        phone: string | null;
        job_title: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
        company_id: number | null;
        company_name: string | null;
        company_website: string | null;
      }>(query, companyId, limit, offset);

      // Count total
      const countResult = await crmDB.rawQueryRow<{ total: string }>(
        `SELECT COUNT(*) as total 
         FROM people p
         LEFT JOIN companies c ON p.company_id = c.id
         WHERE c.id IN (SELECT id FROM companies WHERE id = $1)`,
        companyId
      );
      
      const total = Number(countResult?.total || 0);

      const contacts: Contact[] = rows.map(row => ({
        id: row.id,
        firstName: row.first_name || '',
        lastName: row.last_name || undefined,
        email: row.email || undefined,
        phone: row.phone || undefined,
        jobTitle: row.job_title || undefined,
        status: row.status,
        company: row.company_id ? {
          id: row.company_id,
          name: row.company_name || '',
          website: row.company_website || undefined,
        } : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { contacts, total };
    } catch (error) {
      console.error('Error in getContacts:', error);
      throw error;
    }
  }
);
