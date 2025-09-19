import { Router } from 'express';
import { query } from '../config/database.js';
const router = Router();
// GET /people - List people with optional search, filtering, and sorting
router.get('/', async (req, res) => {
    try {
        const { search = '', tagIds, sortBy = 'name', sortOrder = 'asc', limit = 50, offset = 0 } = req.query;
        // Parse parameters
        const parsedTagIds = tagIds ?
            String(tagIds).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
        const parsedLimit = parseInt(String(limit)) || 50;
        const parsedOffset = parseInt(String(offset)) || 0;
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
        if (parsedTagIds.length > 0) {
            whereClause += ` AND p.id IN (
        SELECT DISTINCT person_id FROM contact_tags 
        WHERE tag_id = ANY($${paramIndex})
      )`;
            queryParams.push(parsedTagIds);
            paramIndex++;
        }
        // Sort clause
        let orderClause = 'ORDER BY ';
        switch (sortBy) {
            case 'name':
                orderClause += `p.first_name ${String(sortOrder).toUpperCase()}, p.last_name ${String(sortOrder).toUpperCase()}`;
                break;
            case 'email':
                orderClause += `p.email ${String(sortOrder).toUpperCase()} NULLS LAST`;
                break;
            case 'company':
                orderClause += `c.name ${String(sortOrder).toUpperCase()} NULLS LAST, p.first_name, p.last_name`;
                break;
            case 'status':
                orderClause += `p.status ${String(sortOrder).toUpperCase()}, p.first_name, p.last_name`;
                break;
            case 'owner':
                orderClause += `u.first_name ${String(sortOrder).toUpperCase()} NULLS LAST, u.last_name ${String(sortOrder).toUpperCase()} NULLS LAST, p.first_name, p.last_name`;
                break;
            case 'lastContacted':
                orderClause += `p.last_contacted_at ${String(sortOrder).toUpperCase()} NULLS LAST`;
                break;
            default:
                orderClause += 'p.created_at DESC';
        }
        // Add limit and offset
        queryParams.push(parsedLimit, parsedOffset);
        const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        const queryText = `
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
        const result = await query(queryText, queryParams);
        // Count total for pagination
        const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM people p
      ${parsedTagIds.length > 0 ? 'LEFT JOIN contact_tags ct ON p.id = ct.person_id' : ''}
      ${whereClause.replace(/LIMIT.*/, '')}
    `;
        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const countResult = await query(countQuery, countParams);
        const total = Number(countResult.rows[0]?.total || 0);
        const people = result.rows.map(row => ({
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
        const response = { people, total };
        res.json(response);
    }
    catch (error) {
        console.error('Error in listPeople:', error);
        res.status(500).json({
            error: 'Failed to fetch people',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /people/:id - Get a single person by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const queryText = `
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
      WHERE p.id = $1
      GROUP BY p.id, c.id, c.name, u.id, u.first_name, u.last_name, u.email
    `;
        const result = await query(queryText, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Person not found' });
        }
        const row = result.rows[0];
        const person = {
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
        };
        res.json(person);
    }
    catch (error) {
        console.error('Error in getPerson:', error);
        res.status(500).json({
            error: 'Failed to fetch person',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=people.js.map