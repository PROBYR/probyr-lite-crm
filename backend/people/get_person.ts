import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface GetPersonParams {
  id: number;
}

export interface Person {
  id: number;
  companyId?: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  company?: {
    id: number;
    name: string;
  };
  tags: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

// Retrieves a single person by ID.
export const getPerson = api<GetPersonParams, Person>(
  { expose: true, method: "GET", path: "/people/:id" },
  async (params) => {
    const query = `
      SELECT 
        p.*,
        c.id as company_id,
        c.name as company_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', t.id, 'name', t.name, 'color', t.color)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::json
        ) as tags
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN contact_tags ct ON p.id = ct.person_id
      LEFT JOIN tags t ON ct.tag_id = t.id
      WHERE p.id = $1
      GROUP BY p.id, c.id, c.name
    `;

    const row = await crmDB.rawQueryRow<{
      id: number;
      company_id: number | null;
      first_name: string;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      job_title: string | null;
      last_contacted_at: Date | null;
      created_at: Date;
      updated_at: Date;
      company_name: string | null;
      tags: any;
    }>(query, params.id);

    if (!row) {
      throw APIError.notFound("person not found");
    }

    return {
      id: row.id,
      companyId: row.company_id || undefined,
      firstName: row.first_name,
      lastName: row.last_name || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
      jobTitle: row.job_title || undefined,
      lastContactedAt: row.last_contacted_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      company: row.company_id ? {
        id: row.company_id,
        name: row.company_name!,
      } : undefined,
      tags: Array.isArray(row.tags) ? row.tags : [],
    };
  }
);
