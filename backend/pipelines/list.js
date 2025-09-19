import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Lists all pipelines for a company with counts.
export const list = api({ expose: true, method: "GET", path: "/pipelines" }, async () => {
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
        const rows = await crmDB.rawQueryAll(query);
        const pipelines = rows.map(row => ({
            id: row.id,
            name: row.name,
            companyId: row.company_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            stageCount: parseInt(row.stage_count),
            dealCount: parseInt(row.deal_count),
        }));
        return { pipelines };
    }
    catch (error) {
        console.error('Error in listPipelines:', error);
        return { pipelines: [] };
    }
});
//# sourceMappingURL=list.js.map