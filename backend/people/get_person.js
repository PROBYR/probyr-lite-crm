import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves a single person by ID.
export const getPerson = api({ expose: true, method: "GET", path: "/people/:id" }, async (params) => {
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
    const row = await crmDB.rawQueryRow(query, params.id);
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
        status: row.status,
        lastContactedAt: row.last_contacted_at || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        company: row.company_id ? {
            id: row.company_id,
            name: row.company_name,
        } : undefined,
        tags: Array.isArray(row.tags) ? row.tags : [],
    };
});
//# sourceMappingURL=get_person.js.map