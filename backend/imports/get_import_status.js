import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves the status of an import job.
export const getImportStatus = api({ expose: true, method: "GET", path: "/imports/:id/status" }, async (params) => {
    const job = await crmDB.queryRow `
      SELECT * FROM import_jobs WHERE id = ${params.id}
    `;
    if (!job) {
        throw APIError.notFound("import job not found");
    }
    const progress = job.total_rows > 0 ? Math.round((job.processed_rows / job.total_rows) * 100) : 0;
    return {
        id: job.id,
        companyId: job.company_id,
        userId: job.user_id,
        filename: job.filename,
        status: job.status,
        totalRows: job.total_rows,
        processedRows: job.processed_rows,
        successRows: job.success_rows,
        errorRows: job.error_rows,
        fieldMapping: JSON.parse(job.field_mapping),
        duplicateHandling: job.duplicate_handling,
        errorLog: job.error_log || undefined,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        progress,
    };
});
//# sourceMappingURL=get_import_status.js.map