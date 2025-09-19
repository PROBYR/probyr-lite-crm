import { Router, Request, Response } from 'express';
import { query, getClient } from '../config/database.js';
import { Person, ListPeopleParams, ListPeopleResponse } from '../types/index.js';

const router = Router();

// GET /people - List people with optional search, filtering, and sorting
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search = '',
      tagIds,
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = req.query as any;

    // Parse parameters
    const parsedTagIds = tagIds ? 
      String(tagIds).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
    const parsedLimit = parseInt(String(limit)) || 50;
    const parsedOffset = parseInt(String(offset)) || 0;

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

    const people: Person[] = result.rows.map(row => ({
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

    const response: ListPeopleResponse = { people, total };
    res.json(response);

  } catch (error) {
    console.error('Error in listPeople:', error);
    res.status(500).json({ 
      error: 'Failed to fetch people',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /people/:id - Get a single person by ID
router.get('/:id', async (req: Request, res: Response) => {
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
    const person: Person = {
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

  } catch (error) {
    console.error('Error in getPerson:', error);
    res.status(500).json({ 
      error: 'Failed to fetch person',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /people - Create a new person
router.post('/', async (req: Request, res: Response) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const {
      companyId,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      status = 'New Lead',
      tagIds = []
    } = req.body;

    if (!firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }

    // Insert person
    const personResult = await client.query(`
      INSERT INTO people (company_id, first_name, last_name, email, phone, job_title, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `, [companyId || null, firstName, lastName || null, email || null, phone || null, jobTitle || null, status]);

    const personId = personResult.rows[0].id;

    // Add tags if specified
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await client.query(`
          INSERT INTO contact_tags (person_id, tag_id)
          VALUES ($1, $2)
          ON CONFLICT (person_id, tag_id) DO NOTHING
        `, [personId, tagId]);
      }
    }

    await client.query('COMMIT');

    // Fetch the created person with full details
    const queryText = `
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

    const result = await query(queryText, [personId]);
    const row = result.rows[0];

    const person: Person = {
      id: row.id,
      companyId: row.company_id || undefined,
      firstName: row.first_name,
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
      owner: undefined,
      tags: Array.isArray(row.tags) ? row.tags : [],
    };

    res.status(201).json(person);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createPerson:', error);
    res.status(500).json({ 
      error: 'Failed to create person',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
});

// PUT /people/:id - Update a person
router.put('/:id', async (req: Request, res: Response) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      companyId,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      status,
      tagIds
    } = req.body;

    // Check if person exists
    const existingResult = await client.query('SELECT id FROM people WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (jobTitle !== undefined) {
      updates.push(`job_title = $${paramIndex++}`);
      values.push(jobTitle);
    }
    if (companyId !== undefined) {
      updates.push(`company_id = $${paramIndex++}`);
      values.push(companyId);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    if (updates.length > 1) { // More than just updated_at
      values.push(id);
      const updateQuery = `
        UPDATE people 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `;
      await client.query(updateQuery, values);
    }

    // Update tags if specified
    if (tagIds !== undefined) {
      // Remove existing tags
      await client.query('DELETE FROM contact_tags WHERE person_id = $1', [id]);
      
      // Add new tags
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          await client.query(`
            INSERT INTO contact_tags (person_id, tag_id)
            VALUES ($1, $2)
          `, [id, tagId]);
        }
      }
    }

    await client.query('COMMIT');

    // Fetch updated person
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
    const person: Person = {
      id: row.id,
      companyId: row.company_id || undefined,
      firstName: row.first_name,
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
      tags: Array.isArray(row.tags) ? row.tags : [],
    };

    res.json(person);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in updatePerson:', error);
    res.status(500).json({ 
      error: 'Failed to update person',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
});

// DELETE /people/:id - Delete a person
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM people WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }
    
    res.status(204).send();

  } catch (error) {
    console.error('Error in deletePerson:', error);
    res.status(500).json({ 
      error: 'Failed to delete person',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /people/assign-owner - Assign owner to multiple contacts
router.post('/assign-owner', async (req, res) => {
  try {
    const { contactIds, ownerId } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }

    if (!ownerId) {
      return res.status(400).json({ error: 'Owner ID is required' });
    }

    const result = await query(`
      UPDATE people 
      SET assigned_to = $1, updated_at = NOW()
      WHERE id = ANY($2::int[])
      RETURNING id
    `, [ownerId, contactIds]);

    res.json({ 
      success: true, 
      updatedCount: result.rows.length,
      updatedIds: result.rows.map(row => row.id)
    });
  } catch (error) {
    console.error('Error in assignOwner:', error);
    res.status(500).json({ error: 'Failed to assign owner' });
  }
});

// POST /people/bulk-tag-update - Add or remove tags from multiple contacts
router.post('/bulk-tag-update', async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { contactIds, tagIds, action } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: 'Tag IDs array is required' });
    }

    if (!action || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "add" or "remove"' });
    }

    if (action === 'add') {
      // Add tags to contacts
      for (const contactId of contactIds) {
        for (const tagId of tagIds) {
          await client.query(`
            INSERT INTO contact_tags (person_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT (person_id, tag_id) DO NOTHING
          `, [contactId, tagId]);
        }
      }
    } else {
      // Remove tags from contacts
      await client.query(`
        DELETE FROM contact_tags 
        WHERE person_id = ANY($1::int[]) AND tag_id = ANY($2::int[])
      `, [contactIds, tagIds]);
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      action,
      contactIds,
      tagIds
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in bulkTagUpdate:', error);
    res.status(500).json({ error: 'Failed to update tags' });
  } finally {
    client.release();
  }
});

// POST /people/delete-contacts - Delete multiple contacts
router.post('/delete-contacts', async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }

    const result = await query(`
      DELETE FROM people 
      WHERE id = ANY($1::int[])
      RETURNING id
    `, [contactIds]);

    res.json({ 
      success: true, 
      deletedCount: result.rows.length,
      deletedIds: result.rows.map(row => row.id)
    });
  } catch (error) {
    console.error('Error in deleteContacts:', error);
    res.status(500).json({ error: 'Failed to delete contacts' });
  }
});

// POST /people/export-contacts - Export contacts to CSV
router.post('/export-contacts', async (req, res) => {
  try {
    const { contactIds, format = 'csv' } = req.body;

    let whereClause = '';
    const queryParams: any[] = [];

    if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
      whereClause = 'WHERE p.id = ANY($1::int[])';
      queryParams.push(contactIds);
    }

    const result = await query(`
      SELECT 
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.job_title,
        p.status,
        c.name as company_name,
        p.created_at
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      ${whereClause}
      ORDER BY p.first_name, p.last_name
    `, queryParams);

    if (format === 'csv') {
      // Generate CSV content
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Status', 'Company', 'Created At'];
      const csvRows = [headers.join(',')];
      
      result.rows.forEach(row => {
        const values = [
          row.first_name || '',
          row.last_name || '',
          row.email || '',
          row.phone || '',
          row.job_title || '',
          row.status || '',
          row.company_name || '',
          row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''
        ];
        csvRows.push(values.map(val => `"${val}"`).join(','));
      });

      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
      res.send(csvContent);
    } else {
      res.json({ contacts: result.rows });
    }
  } catch (error) {
    console.error('Error in exportContacts:', error);
    res.status(500).json({ error: 'Failed to export contacts' });
  }
});

export default router;
