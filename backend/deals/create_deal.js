import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Creates a new deal.
export const createDeal = api({ expose: true, method: "POST", path: "/deals" }, async (req) => {
    try {
        const probability = req.probability || 50;
        const dealRow = await crmDB.queryRow `
        INSERT INTO deals (company_id, person_id, stage_id, title, value, expected_close_date, probability, notes, assigned_to, created_at, updated_at)
        VALUES (${req.companyId}, ${req.personId || null}, ${req.stageId}, ${req.title}, ${req.value || null}, ${req.expectedCloseDate || null}, ${probability}, ${req.notes || null}, ${req.assignedTo || null}, NOW(), NOW())
        RETURNING id
      `;
        if (!dealRow) {
            throw new Error("Failed to create deal");
        }
        // Fetch the created deal with full details using safe casting
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
          d.assigned_to,
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
        WHERE d.id = $1
      `;
        const row = await crmDB.rawQueryRow(query, dealRow.id);
        if (!row) {
            throw new Error("Failed to fetch created deal");
        }
        // Log any value casting issues for debugging
        if (row.value === null || row.value === undefined) {
            console.warn(`Created deal ${row.id} has null/undefined value, coercing to 0`);
        }
        return {
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
            assignedTo: row.assigned_to || undefined,
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
    }
    catch (error) {
        console.error('Error in createDeal:', error);
        throw error;
    }
});
//# sourceMappingURL=create_deal.js.map