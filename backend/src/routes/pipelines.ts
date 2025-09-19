import express from 'express';
import { pool, getClient } from '../config/database.js';

const router = express.Router();

interface Pipeline {
  id: number;
  name: string;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
  stageCount: number;
  dealCount: number;
}

// List all pipelines for a company with counts
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.company_id,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT ds.id) as stage_count,
        COUNT(DISTINCT d.id) as deal_count
      FROM pipelines p
      LEFT JOIN deal_stages ds ON p.id = ds.pipeline_id
      LEFT JOIN deals d ON ds.id = d.stage_id
      WHERE p.company_id = 1
      GROUP BY p.id, p.name, p.company_id, p.created_at, p.updated_at
      ORDER BY p.name
    `;

    const result = await pool.query(query);

    const pipelines: Pipeline[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      companyId: row.company_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      stageCount: parseInt(row.stage_count) || 0,
      dealCount: parseInt(row.deal_count) || 0,
    }));

    res.json({ pipelines });
  } catch (error) {
    console.error('Error in listPipelines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /pipelines/:id - Get detailed pipeline with stages and deals
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get pipeline info
    const pipelineResult = await pool.query(`
      SELECT id, name FROM pipelines WHERE id = $1
    `, [id]);

    if (pipelineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const pipeline = pipelineResult.rows[0];

    // Get stages for this pipeline
    const stagesResult = await pool.query(`
      SELECT id, name, position, is_won, is_lost
      FROM deal_stages
      WHERE pipeline_id = $1
      ORDER BY position
    `, [id]);

    const stages = stagesResult.rows;
    const stageIds = stages.map(s => s.id);

    // Get deals for all stages in this pipeline
    let deals = [];
    if (stageIds.length > 0) {
      const dealsResult = await pool.query(`
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
          p.id as person_id_ref,
          p.first_name as person_first_name,
          p.last_name as person_last_name,
          p.email as person_email,
          ds.id as stage_id_ref,
          ds.name as stage_name,
          ds.position as stage_position,
          ds.is_won as stage_is_won,
          ds.is_lost as stage_is_lost
        FROM deals d
        LEFT JOIN people p ON d.person_id = p.id
        JOIN deal_stages ds ON d.stage_id = ds.id
        WHERE d.stage_id = ANY($1::int[])
      `, [stageIds]);

      deals = dealsResult.rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        personId: row.person_id || undefined,
        stageId: row.stage_id,
        title: row.title,
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
          name: row.stage_name,
          position: row.stage_position,
          isWon: row.stage_is_won || false,
          isLost: row.stage_is_lost || false,
        }
      }));
    }

    // Calculate totals
    let totalValue = 0;
    let wonDeals = 0;
    let closedDeals = 0;

    const stagesWithDeals = stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stageId === stage.id);
      const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      totalValue += stageValue;
      
      if (stage.is_won) wonDeals += stageDeals.length;
      if (stage.is_won || stage.is_lost) closedDeals += stageDeals.length;
      
      return {
        id: stage.id,
        name: stage.name,
        position: stage.position,
        isWon: stage.is_won,
        isLost: stage.is_lost,
        deals: stageDeals,
        totalValue: stageValue,
      };
    });

    const pipelineDetails = {
      id: pipeline.id,
      name: pipeline.name,
      totalDeals: deals.length,
      totalValue,
      averageDealValue: deals.length > 0 ? totalValue / deals.length : 0,
      winRate: closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0,
      stages: stagesWithDeals,
    };

    res.json(pipelineDetails);
  } catch (error) {
    console.error('Error in getPipeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /pipelines/:id - Delete a pipeline
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if pipeline has deals
    const dealsCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM deals d
      JOIN deal_stages ds ON d.stage_id = ds.id
      WHERE ds.pipeline_id = $1
    `, [id]);

    const dealCount = Number(dealsCheck.rows[0]?.count || 0);
    if (dealCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete pipeline with active deals',
        dealCount 
      });
    }

    // Delete the pipeline (stages will be deleted by cascade)
    const result = await pool.query(`
      DELETE FROM pipelines WHERE id = $1 RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in deletePipeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /pipelines - Create a new pipeline with stages
router.post('/', async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const {
      name,
      companyId = 1,
      stages = []
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Pipeline name is required' });
    }

    // Create pipeline
    const pipelineResult = await client.query(`
      INSERT INTO pipelines (name, company_id, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id, name, company_id, created_at, updated_at
    `, [name, companyId]);

    const pipeline = pipelineResult.rows[0];

    // Create stages for this pipeline
    for (const stage of stages) {
      await client.query(`
        INSERT INTO deal_stages (company_id, pipeline_id, name, position, is_won, is_lost, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [companyId, pipeline.id, stage.name, stage.position, stage.isWon || false, stage.isLost || false]);
    }

    await client.query('COMMIT');

    const pipelineResponse = {
      id: pipeline.id,
      name: pipeline.name,
      companyId: pipeline.company_id,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
    };

    res.status(201).json(pipelineResponse);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createPipeline:', error);
    res.status(500).json({ error: 'Failed to create pipeline' });
  } finally {
    client.release();
  }
});

// PUT /pipelines/:id - Update a pipeline and its stages
router.put('/:id', async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      name,
      stages = []
    } = req.body;

    // Check if pipeline exists
    const existingResult = await client.query('SELECT id FROM pipelines WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // Update pipeline name if provided
    if (name) {
      await client.query(`
        UPDATE pipelines 
        SET name = $1, updated_at = NOW()
        WHERE id = $2
      `, [name, id]);
    }

    // Update stages if provided
    if (stages.length > 0) {
      // Delete existing stages
      await client.query('DELETE FROM deal_stages WHERE pipeline_id = $1', [id]);
      
      // Create new stages
      for (const stage of stages) {
        await client.query(`
          INSERT INTO deal_stages (company_id, pipeline_id, name, position, is_won, is_lost, created_at)
          VALUES (1, $1, $2, $3, $4, $5, NOW())
        `, [id, stage.name, stage.position, stage.isWon || false, stage.isLost || false]);
      }
    }

    await client.query('COMMIT');

    // Fetch updated pipeline
    const updatedResult = await pool.query(`
      SELECT id, name, company_id, created_at, updated_at
      FROM pipelines WHERE id = $1
    `, [id]);

    const pipeline = updatedResult.rows[0];
    const pipelineResponse = {
      id: pipeline.id,
      name: pipeline.name,
      companyId: pipeline.company_id,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
    };

    res.json(pipelineResponse);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in updatePipeline:', error);
    res.status(500).json({ error: 'Failed to update pipeline' });
  } finally {
    client.release();
  }
});

export default router;
