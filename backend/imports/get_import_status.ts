import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface GetImportStatusParams {
  id: number;
}

export interface ImportJob {
  id: number;
  companyId: number;
  userId: number;
  filename: string;
  status: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  fieldMapping: Record<string, string>;
  duplicateHandling: string;
  errorLog?: string;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
}

// Retrieves the status of an import job.
export const getImportStatus = api<GetImportStatusParams, ImportJob>(
  { expose: true, method: "GET", path: "/imports/:id/status" },
  async (params) => {
    const job = await crmDB.queryRow<{
      id: number;
      company_id: number;
      user_id: number;
      filename: string;
      status: string;
      total_rows: number;
      processed_rows: number;
      success_rows: number;
      error_rows: number;
      field_mapping: string;
      duplicate_handling: string;
      error_log: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
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
  }
);
