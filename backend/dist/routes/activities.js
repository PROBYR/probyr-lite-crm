import express from 'express';
import { pool } from '../config/database.js';
const router = express.Router();
// GET /activities - List activities with optional filtering
router.get('/', async (req, res) => {
    try {
        const { personId, dealId, activityType, limit = 50, offset = 0 } = req.query;
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;
        if (personId) {
            whereClause += ` AND person_id = $${paramIndex}`;
            queryParams.push(Number(personId));
            paramIndex++;
        }
        if (dealId) {
            whereClause += ` AND deal_id = $${paramIndex}`;
            queryParams.push(Number(dealId));
            paramIndex++;
        }
        if (activityType) {
            whereClause += ` AND activity_type = $${paramIndex}`;
            queryParams.push(activityType);
            paramIndex++;
        }
        queryParams.push(Number(limit), Number(offset));
        const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        const query = `
      SELECT 
        a.*,
        p.first_name as person_first_name,
        p.last_name as person_last_name,
        d.title as deal_title,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM activities a
      LEFT JOIN people p ON a.person_id = p.id
      LEFT JOIN deals d ON a.deal_id = d.id
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.activity_date DESC, a.created_at DESC
      ${limitClause}
    `;
        const result = await pool.query(query, queryParams);
        const activities = result.rows.map(row => ({
            id: row.id,
            companyId: row.company_id,
            personId: row.person_id || undefined,
            dealId: row.deal_id || undefined,
            userId: row.user_id,
            activityType: row.activity_type,
            subject: row.subject,
            notes: row.notes || undefined,
            activityDate: row.activity_date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
        res.json({ activities });
    }
    catch (error) {
        console.error('Error in listActivities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /activities - Create a new activity
router.post('/', async (req, res) => {
    try {
        const { companyId = 1, personId, dealId, userId = 1, activityType, subject, notes, activityDate } = req.body;
        if (!activityType || !subject) {
            return res.status(400).json({ error: 'Activity type and subject are required' });
        }
        const result = await pool.query(`
      INSERT INTO activities (company_id, person_id, deal_id, user_id, activity_type, subject, notes, activity_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [companyId, personId || null, dealId || null, userId, activityType, subject, notes || null, activityDate || new Date()]);
        const row = result.rows[0];
        const activity = {
            id: row.id,
            companyId: row.company_id,
            personId: row.person_id || undefined,
            dealId: row.deal_id || undefined,
            userId: row.user_id,
            activityType: row.activity_type,
            subject: row.subject,
            notes: row.notes || undefined,
            activityDate: row.activity_date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
        res.status(201).json(activity);
    }
    catch (error) {
        console.error('Error in createActivity:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
});
export default router;
//# sourceMappingURL=activities.js.map