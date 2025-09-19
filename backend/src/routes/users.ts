import express from 'express';
import { pool, getClient } from '../config/database.js';

const router = express.Router();

interface User {
  id: number;
  companyId: number;
  firstName: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// GET /users - List all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM users
      WHERE company_id = 1
      ORDER BY first_name, last_name
    `);

    const users: User[] = result.rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      firstName: row.first_name,
      lastName: row.last_name || undefined,
      email: row.email,
      role: row.role || 'user',
      isActive: row.is_active !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ users });
  } catch (error) {
    console.error('Error in listUsers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id - Get a single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM users WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      companyId: row.company_id,
      firstName: row.first_name,
      lastName: row.last_name || undefined,
      email: row.email,
      role: row.role || 'user',
      isActive: row.is_active !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json(user);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/invite - Invite a new user
router.post('/invite', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role = 'user',
      companyId = 1
    } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({ error: 'First name and email are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const result = await pool.query(`
      INSERT INTO users (company_id, first_name, last_name, email, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING *
    `, [companyId, firstName, lastName || null, email, role]);

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      companyId: row.company_id,
      firstName: row.first_name,
      lastName: row.last_name || undefined,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.status(201).json(user);
  } catch (error) {
    console.error('Error in inviteUser:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// PUT /users/:id - Update a user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      isActive
    } = req.body;

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
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      companyId: row.company_id,
      firstName: row.first_name,
      lastName: row.last_name || undefined,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json(user);
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /users/deactivate - Deactivate users
router.post('/deactivate', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    const result = await pool.query(`
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = ANY($1::int[])
      RETURNING id
    `, [userIds]);

    res.json({ 
      success: true, 
      deactivatedCount: result.rows.length,
      deactivatedIds: result.rows.map(row => row.id)
    });
  } catch (error) {
    console.error('Error in deactivateUsers:', error);
    res.status(500).json({ error: 'Failed to deactivate users' });
  }
});

// POST /users/delete - Delete users
router.post('/delete', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    const result = await pool.query(`
      DELETE FROM users 
      WHERE id = ANY($1::int[])
      RETURNING id
    `, [userIds]);

    res.json({ 
      success: true, 
      deletedCount: result.rows.length,
      deletedIds: result.rows.map(row => row.id)
    });
  } catch (error) {
    console.error('Error in deleteUsers:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// GET /users/:userId/email-signature - Get user email signature
router.get('/:userId/email-signature', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT email_signature FROM users WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      signature: result.rows[0].email_signature || ''
    });
  } catch (error) {
    console.error('Error in getEmailSignature:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /users/:userId/email-signature - Update user email signature
router.put('/:userId/email-signature', async (req, res) => {
  try {
    const { userId } = req.params;
    const { signature } = req.body;

    const result = await pool.query(`
      UPDATE users 
      SET email_signature = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `, [signature || '', userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in updateEmailSignature:', error);
    res.status(500).json({ error: 'Failed to update email signature' });
  }
});

export default router;
