import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

interface Stage {
  id: number;
  pipelineId: number;
  name: string;
  color: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// GET /stages - List stages for a pipeline
router.get('/', async (req, res) => {
  try {
    const { pipelineId, companyId } = req.query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (pipelineId) {
      whereClause += ` AND pipeline_id = $${paramIndex}`;
      queryParams.push(Number(pipelineId));
      paramIndex++;
    }

    if (companyId) {
      whereClause += ` AND pipeline_id IN (SELECT id FROM pipelines WHERE company_id = $${paramIndex})`;
      queryParams.push(Number(companyId));
      paramIndex++;
    }

    const query = `
      SELECT * FROM deal_stages
      ${whereClause}
      ORDER BY position ASC
    `;

    const result = await pool.query(query, queryParams);

    const stages: Stage[] = result.rows.map(row => ({
      id: row.id,
      pipelineId: row.pipeline_id,
      name: row.name,
      color: row.color || '#3B82F6',
      position: row.position,
      isWon: row.is_won || false,
      isLost: row.is_lost || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ stages });
  } catch (error) {
    console.error('Error in listStages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
