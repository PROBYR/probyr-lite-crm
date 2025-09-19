import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves deals with optional filtering.
export const listDeals = api({ expose: true, method: "GET", path: "/deals" }, async (params) => {
    const stageId = params.stageId;
    const personId = params.personId;
    const limit = params.limit || 100;
    const offset = params.offset || 0;
    try {
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;
        if (stageId) {
            whereClause += ` AND d.stage_id = $${paramIndex}`;
            queryParams.push(stageId);
            paramIndex++;
        }
        if (personId) {
            whereClause += ` AND d.person_id = $${paramIndex}`;
            queryParams.push(personId);
            paramIndex++;
        }
        queryParams.push(limit, offset);
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
        const rows = await crmDB.rawQueryAll(query, ...queryParams);
        // Count total
        const countQuery = `
        SELECT COUNT(*) as total
        FROM deals d
        ${whereClause.replace(/LIMIT.*/, '')}
      `;
        const countParams = queryParams.slice(0, -2);
        const countResult = await crmDB.rawQueryRow(countQuery, ...countParams);
        const total = Number(countResult?.total || 0);
        const deals = rows.map(row => {
            // Log any value casting issues for debugging
            if (row.value === null || row.value === undefined) {
                console.warn(`Deal ${row.id} has null/undefined value, coercing to 0`);
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
        });
        return { deals, total };
    }
    catch (error) {
        console.error('Error in listDeals:', error);
        // Return consistent shape even on error
        return { deals: [], total: 0 };
    }
});
//# sourceMappingURL=list_deals.js.map