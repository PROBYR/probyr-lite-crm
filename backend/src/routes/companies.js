import express from 'express';
import { pool } from '../config/database.js';
const router = express.Router();
// Get company by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }
        const result = await pool.query(`
      SELECT * FROM companies WHERE id = $1
    `, [Number(id)]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        const company = result.rows[0];
        const companyResponse = {
            id: company.id,
            name: company.name,
            website: company.website || undefined,
            phone: company.phone || undefined,
            address: company.address || undefined,
            bccEmail: company.bcc_email,
            createdAt: company.created_at,
            updatedAt: company.updated_at,
        };
        res.json(companyResponse);
    }
    catch (error) {
        console.error('Error in getCompany:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update company
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, website, phone, address } = req.body;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }
        // Check if company exists
        const existingResult = await pool.query(`
      SELECT id FROM companies WHERE id = $1
    `, [Number(id)]);
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (website !== undefined) {
            updates.push(`website = $${paramIndex++}`);
            values.push(website);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }
        if (address !== undefined) {
            updates.push(`address = $${paramIndex++}`);
            values.push(address);
        }
        updates.push(`updated_at = $${paramIndex++}`);
        values.push(new Date());
        if (updates.length > 1) { // More than just updated_at
            values.push(Number(id));
            const updateQuery = `
        UPDATE companies 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `;
            await pool.query(updateQuery, values);
        }
        // Fetch updated company
        const updatedResult = await pool.query(`
      SELECT * FROM companies WHERE id = $1
    `, [Number(id)]);
        if (updatedResult.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        const updatedCompany = updatedResult.rows[0];
        const companyResponse = {
            id: updatedCompany.id,
            name: updatedCompany.name,
            website: updatedCompany.website || undefined,
            phone: updatedCompany.phone || undefined,
            address: updatedCompany.address || undefined,
            bccEmail: updatedCompany.bcc_email,
            createdAt: updatedCompany.created_at,
            updatedAt: updatedCompany.updated_at,
        };
        res.json(companyResponse);
    }
    catch (error) {
        console.error('Error in updateCompany:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// List all companies
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT * FROM companies ORDER BY name
    `);
        const companies = result.rows.map(row => ({
            id: row.id,
            name: row.name || '',
            website: row.website || undefined,
            phone: row.phone || undefined,
            address: row.address || undefined,
            bccEmail: row.bcc_email || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
        res.json({ companies });
    }
    catch (error) {
        console.error('Error in listCompanies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=companies.js.map