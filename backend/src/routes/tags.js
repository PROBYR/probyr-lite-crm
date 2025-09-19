import express from 'express';
import { pool } from '../config/database.js';
const router = express.Router();
// List all tags for a company
router.get('/', async (req, res) => {
    try {
        const companyId = req.query.companyId ? Number(req.query.companyId) : 1; // Default to demo company
        const result = await pool.query(`
      SELECT * FROM tags 
      WHERE company_id = $1
      ORDER BY name
    `, [companyId]);
        const tags = result.rows.map(row => ({
            id: row.id,
            companyId: row.company_id,
            name: row.name || '',
            color: row.color || '#3B82F6',
            createdAt: row.created_at,
        }));
        res.json({ tags });
    }
    catch (error) {
        console.error('Error in listTags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=tags.js.map