import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves people with optional search, filtering, and sorting.
export const listPeople = api({ expose: true, method: "GET", path: "/people" }, async (params) => {
    try {
        const search = params.search || '';
        const tagIds = params.tagIds ? params.tagIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
        const sortBy = params.sortBy || 'name';
        const sortOrder = params.sortOrder || 'asc';
        const limit = params.limit || 50;
        const offset = params.offset || 0;
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
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
                orderClause += `p.first_name ${sortOrder.toUpperCase()}, p.last_name ${sortOrder.toUpperCase()}`;
                break;
            case 'email':
                orderClause += `p.email ${sortOrder.toUpperCase()} NULLS LAST`;
                break;
            case 'company':
                orderClause += `c.name ${sortOrder.toUpperCase()} NULLS LAST, p.first_name, p.last_name`;
                break;
            case 'status':
                orderClause += `p.status ${sortOrder.toUpperCase()}, p.first_name, p.last_name`;
                break;
            case 'owner':
                orderClause += `u.first_name ${sortOrder.toUpperCase()} NULLS LAST, u.last_name ${sortOrder.toUpperCase()} NULLS LAST, p.first_name, p.last_name`;
                break;
            case 'lastContacted':
                orderClause += `p.last_contacted_at ${sortOrder.toUpperCase()} NULLS LAST`;
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
          u.id as owner_id,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name,
          u.email as owner_email,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT('id', t.id, 'name', t.name, 'color', t.color)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
          ) as tags
        FROM people p
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users u ON p.assigned_to = u.id
        LEFT JOIN contact_tags ct ON p.id = ct.person_id
        LEFT JOIN tags t ON ct.tag_id = t.id
        ${whereClause}
        GROUP BY p.id, c.id, c.name, u.id, u.first_name, u.last_name, u.email
        ${orderClause}
        ${limitClause}
      `;
        const rows = await crmDB.rawQueryAll(query, ...queryParams);
        // Count total for pagination
        const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM people p
        ${tagIds.length > 0 ? 'LEFT JOIN contact_tags ct ON p.id = ct.person_id' : ''}
        ${whereClause.replace(/LIMIT.*/, '')}
      `;
        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const countResult = await crmDB.rawQueryRow(countQuery, ...countParams);
        const total = Number(countResult?.total || 0);
        const people = rows.map(row => ({
            id: row.id,
            companyId: row.company_id || undefined,
            firstName: row.first_name || '',
            lastName: row.last_name || undefined,
            email: row.email || undefined,
            phone: row.phone || undefined,
            jobTitle: row.job_title || undefined,
            status: row.status,
            assignedTo: row.assigned_to || undefined,
            lastContactedAt: row.last_contacted_at || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            company: row.company_id && row.company_name ? {
                id: row.company_id,
                name: row.company_name,
            } : undefined,
            owner: row.owner_id ? {
                id: row.owner_id,
                firstName: row.owner_first_name || '',
                lastName: row.owner_last_name || undefined,
                email: row.owner_email || '',
            } : undefined,
            tags: Array.isArray(row.tags) ? row.tags.filter(t => t && t.id) : [],
        }));
        return { people, total };
    }
    catch (error) {
        console.error('Error in listPeople:', error);
        return { people: [], total: 0 };
    }
});
//# sourceMappingURL=list_people.js.map