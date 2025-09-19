import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
// Deletes a pipeline if it contains no deals.
export const deletePipeline = api({ expose: true, method: "DELETE", path: "/pipelines/:id" }, async (params) => {
    const tx = await crmDB.begin();
    try {
        // Check if pipeline exists
        const pipeline = await tx.queryRow `
        SELECT id FROM pipelines WHERE id = ${params.id}
      `;
        if (!pipeline) {
            throw APIError.notFound("pipeline not found");
        }
        // Check if pipeline has any deals
        const dealCountResult = await tx.queryRow `
        SELECT COUNT(*) as count
        FROM deals d
        JOIN deal_stages ds ON d.stage_id = ds.id
        WHERE ds.pipeline_id = ${params.id}
      `;
        if (dealCountResult && parseInt(dealCountResult.count) > 0) {
            throw APIError.failedPrecondition("This pipeline cannot be deleted because it contains active deals. Please move or delete the deals first.");
        }
        // Delete stages first
        await tx.exec `
        DELETE FROM deal_stages WHERE pipeline_id = ${params.id}
      `;
        // Delete pipeline
        await tx.exec `
        DELETE FROM pipelines WHERE id = ${params.id}
      `;
        await tx.commit();
    }
    catch (error) {
        await tx.rollback();
        throw error;
    }
});
//# sourceMappingURL=delete_pipeline.js.map