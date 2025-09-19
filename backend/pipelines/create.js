import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Creates a new pipeline with stages.
export const create = api({ expose: true, method: "POST", path: "/pipelines" }, async (req) => {
    const tx = await crmDB.begin();
    try {
        // Create pipeline
        const pipelineRow = await tx.queryRow `
        INSERT INTO pipelines (name, company_id, created_at, updated_at)
        VALUES (${req.name}, ${req.companyId}, NOW(), NOW())
        RETURNING id, name, company_id, created_at, updated_at
      `;
        if (!pipelineRow) {
            throw new Error("Failed to create pipeline");
        }
        // Create stages for this pipeline
        for (const stage of req.stages) {
            await tx.exec `
          INSERT INTO deal_stages (company_id, pipeline_id, name, position, is_won, is_lost, created_at)
          VALUES (${req.companyId}, ${pipelineRow.id}, ${stage.name}, ${stage.position}, ${stage.isWon}, ${stage.isLost}, NOW())
        `;
        }
        await tx.commit();
        return {
            id: pipelineRow.id,
            name: pipelineRow.name,
            companyId: pipelineRow.company_id,
            createdAt: pipelineRow.created_at,
            updatedAt: pipelineRow.updated_at,
        };
    }
    catch (error) {
        await tx.rollback();
        throw error;
    }
});
//# sourceMappingURL=create.js.map