import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";

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

export interface ListPeopleParams {
  search?: Query<string>;
  tagIds?: Query<string>;
  sortBy?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListPeopleResponse {
  people: Person[];
  total: number;
}

// Retrieves people with optional search, filtering, and sorting.
export const listPeople = api<ListPeopleParams, ListPeopleResponse>(
  { expose: true, method: "GET", path: "/people" },
  async (params) => {
    const search = params.search || '';
    const tagIds = params.tagIds ? params.tagIds.split(',').map(id => parseInt(id)) : [];
    const sortBy = params.sortBy || 'name';
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      whereClause += ` AND (p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Tag filter
    if (tagIds.length > 0) {
      whereClause += ` AND p.id IN (
        SELECT DISTINCT person_id FROM contact_tags 
        WHERE tag_id = ANY($${paramIndex})
      )`;
      queryParams.push(tagIds);
      paramIndex++;
    }

    // Sort clause
    let orderClause = 'ORDER BY ';
    switch (sortBy) {
      case 'name':
        orderClause += 'p.first_name, p.last_name';
        break;
      case 'lastContacted':
        orderClause += 'p.last_contacted_at DESC NULLS LAST';
        break;
      case 'company':
        orderClause += 'c.name, p.first_name, p.last_name';
        break;
      default:
        orderClause += 'p.created_at DESC';
    }

    // Add limit and offset
    queryParams.push(limit, offset);
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

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
      ${whereClause}
      GROUP BY p.id, c.id, c.name
      ${orderClause}
      ${limitClause}
    `;

    const rows = await crmDB.rawQueryAll<{
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
    }>(query, ...queryParams);

    // Count total for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      ${tagIds.length > 0 ? 'LEFT JOIN contact_tags ct ON p.id = ct.person_id' : ''}
      ${whereClause.replace(/LIMIT.*/, '')}
    `;
    
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const countResult = await crmDB.rawQueryRow<{ total: number }>(countQuery, ...countParams);
    const total = countResult?.total || 0;

    const people: Person[] = rows.map(row => ({
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
    }));

    return { people, total };
  }
);
