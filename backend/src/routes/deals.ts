import express from 'express';
import { pool, getClient } from '../config/database.js';

const router = express.Router();

interface Deal {
  id: number;
  companyId: number;
  personId?: number;
  stageId: number;
  title: string;
  value?: number;
  expectedCloseDate?: Date;
  probability: number;
  lossReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  person?: {
    id: number;
    firstName: string;
    lastName?: string;
    email?: string;
  };
  stage: {
    id: number;
    name: string;
    position: number;
    isWon: boolean;
    isLost: boolean;
  };
}

// GET /deals - List deals with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      stageId,
      personId,
      limit = 100,
      offset = 0
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (stageId) {
      whereClause += ` AND d.stage_id = $${paramIndex}`;
      queryParams.push(Number(stageId));
      paramIndex++;
    }

    if (personId) {
      whereClause += ` AND d.person_id = $${paramIndex}`;
      queryParams.push(Number(personId));
      paramIndex++;
    }

    queryParams.push(Number(limit), Number(offset));
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const query = `
      SELECT 
        d.id, 
        d.company_id, 
        d.person_id, 
        d.stage_id, 
        d.title, 
        COALESCE(d.value::double precision, 0)::double precision as value,
        d.expected_close_date, 
        d.probability, 
        d.loss_reason, 
        d.notes, 
        d.created_at, 
        d.updated_at,
        p.first_name as person_first_name,
        p.last_name as person_last_name,
        p.email as person_email,
        ds.name as stage_name,
        ds.position as stage_position,
        ds.is_won as stage_is_won,
        ds.is_lost as stage_is_lost
      FROM deals d
      LEFT JOIN people p ON d.person_id = p.id
      JOIN deal_stages ds ON d.stage_id = ds.id
      ${whereClause}
      ORDER BY d.created_at DESC
      ${limitClause}
    `;

    const result = await pool.query(query, queryParams);

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM deals d
      ${whereClause.replace(/LIMIT.*/, '')}
    `;
    const countParams = queryParams.slice(0, -2);
    const countResult = await pool.query(countQuery, countParams);
    const total = Number(countResult.rows[0]?.total || 0);

    const deals: Deal[] = result.rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      personId: row.person_id || undefined,
      stageId: row.stage_id,
      title: row.title || '',
      value: typeof row.value === 'number' ? row.value : 0,
      expectedCloseDate: row.expected_close_date || undefined,
      probability: row.probability || 0,
      lossReason: row.loss_reason || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      person: row.person_id ? {
        id: row.person_id,
        firstName: row.person_first_name || '',
        lastName: row.person_last_name || undefined,
        email: row.person_email || undefined,
      } : undefined,
      stage: {
        id: row.stage_id,
        name: row.stage_name || '',
        position: row.stage_position || 0,
        isWon: row.stage_is_won || false,
        isLost: row.stage_is_lost || false,
      },
    }));

    res.json({ deals, total });
  } catch (error) {
    console.error('Error in listDeals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /deals/table - List deals in table format for pipeline view
router.get('/table', async (req, res) => {
  try {
    const {
      pipelineId,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = 100,
      offset = 0
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (pipelineId) {
      whereClause += ` AND ds.pipeline_id = $${paramIndex}`;
      queryParams.push(Number(pipelineId));
      paramIndex++;
    }

    queryParams.push(Number(limit), Number(offset));
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const query = `
      SELECT 
        d.id, 
        d.company_id, 
        d.person_id, 
        d.stage_id, 
        d.title, 
        COALESCE(d.value::double precision, 0)::double precision as value,
        d.expected_close_date, 
        d.probability, 
        d.created_at, 
        d.updated_at,
        p.first_name as person_first_name,
        p.last_name as person_last_name,
        p.email as person_email,
        c.name as company_name,
        ds.name as stage_name,
        ds.position as stage_position,
        ds.is_won as stage_is_won,
        ds.is_lost as stage_is_lost,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.email as owner_email
      FROM deals d
      LEFT JOIN people p ON d.person_id = p.id
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN users u ON d.assigned_to = u.id
      JOIN deal_stages ds ON d.stage_id = ds.id
      ${whereClause}
      ORDER BY d.${sortBy} ${sortOrder}
      ${limitClause}
    `;

    const result = await pool.query(query, queryParams);
    res.json({ deals: result.rows });
  } catch (error) {
    console.error('Error in listDealsTable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /deals - Create a new deal
router.post('/', async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const {
      companyId,
      personId,
      stageId,
      title,
      value = 0,
      expectedCloseDate,
      probability = 0,
      notes,
      assignedTo
    } = req.body;

    if (!title || !stageId) {
      return res.status(400).json({ error: 'Title and stage are required' });
    }

    // Insert deal
    const dealResult = await client.query(`
      INSERT INTO deals (company_id, person_id, stage_id, title, value, expected_close_date, probability, notes, assigned_to, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id
    `, [companyId || 1, personId || null, stageId, title, value, expectedCloseDate || null, probability, notes || null, assignedTo || null]);

    const dealId = dealResult.rows[0].id;

    await client.query('COMMIT');

    // Fetch the created deal with full details
    const queryText = `
      SELECT 
        d.*,
        p.first_name as person_first_name,
        p.last_name as person_last_name,
        p.email as person_email,
        ds.name as stage_name,
        ds.position as stage_position,
        ds.is_won as stage_is_won,
        ds.is_lost as stage_is_lost
      FROM deals d
      LEFT JOIN people p ON d.person_id = p.id
      JOIN deal_stages ds ON d.stage_id = ds.id
      WHERE d.id = $1
    `;

    const result = await pool.query(queryText, [dealId]);
    const row = result.rows[0];

    const deal: Deal = {
      id: row.id,
      companyId: row.company_id,
      personId: row.person_id || undefined,
      stageId: row.stage_id,
      title: row.title,
      value: row.value || 0,
      expectedCloseDate: row.expected_close_date || undefined,
      probability: row.probability || 0,
      lossReason: row.loss_reason || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      person: row.person_id ? {
        id: row.person_id,
        firstName: row.person_first_name || '',
        lastName: row.person_last_name || undefined,
        email: row.person_email || undefined,
      } : undefined,
      stage: {
        id: row.stage_id,
        name: row.stage_name || '',
        position: row.stage_position || 0,
        isWon: row.stage_is_won || false,
        isLost: row.stage_is_lost || false,
      },
    };

    res.status(201).json(deal);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createDeal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  } finally {
    client.release();
  }
});

// PUT /deals/:id/stage - Update deal stage
router.put('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stageId, lossReason } = req.body;

    if (!stageId) {
      return res.status(400).json({ error: 'Stage ID is required' });
    }

    const result = await pool.query(`
      UPDATE deals 
      SET stage_id = $1, loss_reason = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [stageId, lossReason || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in updateDealStage:', error);
    res.status(500).json({ error: 'Failed to update deal stage' });
  }
});

export default router;
