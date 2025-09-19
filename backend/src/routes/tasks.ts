import express from 'express';
import { pool, getClient } from '../config/database.js';

const router = express.Router();

interface Task {
  id: number;
  companyId: number;
  personId?: number;
  dealId?: number;
  assignedTo: number;
  title: string;
  description?: string;
  dueDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  person?: {
    id: number;
    firstName: string;
    lastName?: string;
    email?: string;
  };
  deal?: {
    id: number;
    title: string;
  };
  assignee?: {
    id: number;
    firstName: string;
    lastName?: string;
    email: string;
  };
}

// GET /tasks - List tasks with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      assignedTo,
      personId,
      dealId,
      isCompleted,
      dueBefore,
      dueAfter,
      limit = 100,
      offset = 0
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (assignedTo) {
      whereClause += ` AND t.assigned_to = $${paramIndex}`;
      queryParams.push(Number(assignedTo));
      paramIndex++;
    }

    if (personId) {
      whereClause += ` AND t.person_id = $${paramIndex}`;
      queryParams.push(Number(personId));
      paramIndex++;
    }

    if (dealId) {
      whereClause += ` AND t.deal_id = $${paramIndex}`;
      queryParams.push(Number(dealId));
      paramIndex++;
    }

    if (isCompleted !== undefined) {
      const completed = isCompleted === 'true';
      whereClause += ` AND t.is_completed = $${paramIndex}`;
      queryParams.push(completed);
      paramIndex++;
    }

    if (dueBefore) {
      whereClause += ` AND t.due_date <= $${paramIndex}`;
      queryParams.push(dueBefore);
      paramIndex++;
    }

    if (dueAfter) {
      whereClause += ` AND t.due_date >= $${paramIndex}`;
      queryParams.push(dueAfter);
      paramIndex++;
    }

    queryParams.push(Number(limit), Number(offset));
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const query = `
      SELECT 
        t.*,
        p.first_name as person_first_name,
        p.last_name as person_last_name,
        p.email as person_email,
        d.title as deal_title,
        u.first_name as assignee_first_name,
        u.last_name as assignee_last_name,
        u.email as assignee_email
      FROM tasks t
      LEFT JOIN people p ON t.person_id = p.id
      LEFT JOIN deals d ON t.deal_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
      ORDER BY 
        CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
        t.due_date ASC,
        t.created_at DESC
      ${limitClause}
    `;

    const result = await pool.query(query, queryParams);

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tasks t
      ${whereClause.replace(/LIMIT.*/, '')}
    `;
    const countParams = queryParams.slice(0, -2);
    const countResult = await pool.query(countQuery, countParams);
    const total = Number(countResult.rows[0]?.total || 0);

    const tasks: Task[] = result.rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      personId: row.person_id || undefined,
      dealId: row.deal_id || undefined,
      assignedTo: row.assigned_to,
      title: row.title,
      description: row.description || undefined,
      dueDate: row.due_date || undefined,
      isCompleted: row.is_completed || false,
      completedAt: row.completed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      person: row.person_id ? {
        id: row.person_id,
        firstName: row.person_first_name || '',
        lastName: row.person_last_name || undefined,
        email: row.person_email || undefined,
      } : undefined,
      deal: row.deal_id ? {
        id: row.deal_id,
        title: row.deal_title || '',
      } : undefined,
      assignee: {
        id: row.assigned_to,
        firstName: row.assignee_first_name || '',
        lastName: row.assignee_last_name || undefined,
        email: row.assignee_email || '',
      },
    }));

    res.json({ tasks, total });
  } catch (error) {
    console.error('Error in listTasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const {
      companyId = 1,
      personId,
      dealId,
      assignedTo,
      title,
      description,
      dueDate,
      priority = 'medium'
    } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ error: 'Title and assignedTo are required' });
    }

    const result = await pool.query(`
      INSERT INTO tasks (company_id, person_id, deal_id, assigned_to, title, description, due_date, is_completed, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW(), NOW())
      RETURNING id
    `, [companyId, personId || null, dealId || null, assignedTo, title, description || null, dueDate || null]);

    const taskId = result.rows[0].id;

    // Fetch the created task with full details
    const queryText = `
      SELECT 
        t.*,
        p.first_name as person_first_name,
        p.last_name as person_last_name,
        p.email as person_email,
        d.title as deal_title,
        u.first_name as assignee_first_name,
        u.last_name as assignee_last_name,
        u.email as assignee_email
      FROM tasks t
      LEFT JOIN people p ON t.person_id = p.id
      LEFT JOIN deals d ON t.deal_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
    `;

    const taskResult = await pool.query(queryText, [taskId]);
    const row = taskResult.rows[0];

    const task: Task = {
      id: row.id,
      companyId: row.company_id,
      personId: row.person_id || undefined,
      dealId: row.deal_id || undefined,
      assignedTo: row.assigned_to,
      title: row.title,
      description: row.description || undefined,
      dueDate: row.due_date || undefined,
      isCompleted: row.is_completed || false,
      completedAt: row.completed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      person: row.person_id ? {
        id: row.person_id,
        firstName: row.person_first_name || '',
        lastName: row.person_last_name || undefined,
        email: row.person_email || undefined,
      } : undefined,
      deal: row.deal_id ? {
        id: row.deal_id,
        title: row.deal_title || '',
      } : undefined,
      assignee: {
        id: row.assigned_to,
        firstName: row.assignee_first_name || '',
        lastName: row.assignee_last_name || undefined,
        email: row.assignee_email || '',
      },
    };

    res.status(201).json(task);
  } catch (error) {
    console.error('Error in createTask:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /tasks/:id - Update a task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      dueDate,
      isCompleted,
      assignedTo
    } = req.body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(dueDate);
    }
    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(assignedTo);
    }
    if (isCompleted !== undefined) {
      updates.push(`is_completed = $${paramIndex++}`);
      values.push(isCompleted);
      if (isCompleted) {
        updates.push(`completed_at = $${paramIndex++}`);
        values.push(new Date());
      }
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in updateTask:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;
