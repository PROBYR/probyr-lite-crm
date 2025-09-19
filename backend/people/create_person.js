import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Creates a new person.
export const createPerson = api({ expose: true, method: "POST", path: "/people" }, async (req) => {
    // Start transaction
    const tx = await crmDB.begin();
    try {
        // Insert person
        const personRow = await tx.queryRow `
        INSERT INTO people (company_id, first_name, last_name, email, phone, job_title, status, created_at, updated_at)
        VALUES (${req.companyId || 1}, ${req.firstName}, ${req.lastName || null}, ${req.email || null}, ${req.phone || null}, ${req.jobTitle || null}, ${req.status || 'New Lead'}, NOW(), NOW())
        RETURNING id
      `;
        if (!personRow) {
            throw new Error("Failed to create person");
        }
        const personId = personRow.id;
        // Add tags if specified
        if (req.tagIds && req.tagIds.length > 0) {
            for (const tagId of req.tagIds) {
                await tx.exec `
            INSERT INTO contact_tags (person_id, tag_id)
            VALUES (${personId}, ${tagId})
            ON CONFLICT (person_id, tag_id) DO NOTHING
          `;
            }
        }
        await tx.commit();
        // Fetch the created person with full details
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
        const row = await crmDB.rawQueryRow(query, personId);
        if (!row) {
            throw new Error("Failed to fetch created person");
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
//# sourceMappingURL=create_person.js.map