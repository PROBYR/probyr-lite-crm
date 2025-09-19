import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
// Updates an existing person.
export const updatePerson = api({ expose: true, method: "PUT", path: "/people/:id" }, async (req) => {
    const tx = await crmDB.begin();
    try {
        // Check if person exists
        const existingPerson = await tx.queryRow `
        SELECT id FROM people WHERE id = ${req.id}
      `;
        if (!existingPerson) {
            throw APIError.notFound("person not found");
        }
        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (req.firstName !== undefined) {
            updates.push(`first_name = $${paramIndex++}`);
            values.push(req.firstName);
        }
        if (req.lastName !== undefined) {
            updates.push(`last_name = $${paramIndex++}`);
            values.push(req.lastName);
        }
        if (req.email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            values.push(req.email);
        }
        if (req.phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(req.phone);
        }
        if (req.jobTitle !== undefined) {
            updates.push(`job_title = $${paramIndex++}`);
            values.push(req.jobTitle);
        }
        if (req.companyId !== undefined) {
            updates.push(`company_id = $${paramIndex++}`);
            values.push(req.companyId);
        }
        if (req.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(req.status);
        }
        updates.push(`updated_at = $${paramIndex++}`);
        values.push(new Date());
        if (updates.length > 1) { // More than just updated_at
            values.push(req.id);
            const updateQuery = `
          UPDATE people 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
        `;
            await tx.rawExec(updateQuery, ...values);
        }
        // Update tags if specified
        if (req.tagIds !== undefined) {
            // Remove existing tags
            await tx.exec `DELETE FROM contact_tags WHERE person_id = ${req.id}`;
            // Add new tags
            if (req.tagIds.length > 0) {
                for (const tagId of req.tagIds) {
                    await tx.exec `
              INSERT INTO contact_tags (person_id, tag_id)
              VALUES (${req.id}, ${tagId})
            `;
                }
            }
        }
        await tx.commit();
        // Fetch updated person
        const query = `
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
        const row = await crmDB.rawQueryRow(query, req.id);
        if (!row) {
            throw APIError.notFound("person not found");
        }
        return {
            id: row.id,
            companyId: row.company_id || undefined,
            firstName: row.first_name,
            lastName: row.last_name || undefined,
            email: row.email || undefined,
            phone: row.phone || undefined,
            jobTitle: row.job_title || undefined,
            status: row.status,
            lastContactedAt: row.last_contacted_at || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            company: row.company_id ? {
                id: row.company_id,
                name: row.company_name,
            } : undefined,
            tags: Array.isArray(row.tags) ? row.tags : [],
        };
    }
    catch (error) {
        await tx.rollback();
        throw error;
    }
});
//# sourceMappingURL=update_person.js.map