import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface CreateImportRequest {
  companyId: number;
  userId: number;
  filename: string;
  fieldMapping: Record<string, string>;
  duplicateHandling: 'skip' | 'merge' | 'create';
  csvData: string[][];
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
}

// Creates a new import job and processes the CSV data.
export const createImport = api<CreateImportRequest, ImportJob>(
  { expose: true, method: "POST", path: "/imports" },
  async (req) => {
    const tx = await crmDB.begin();
    
    try {
      // Create import job
      const importRow = await tx.queryRow<{ id: number }>`
        INSERT INTO import_jobs (company_id, user_id, filename, status, total_rows, field_mapping, duplicate_handling, created_at, updated_at)
        VALUES (${req.companyId}, ${req.userId}, ${req.filename}, 'queued', ${req.csvData.length}, ${JSON.stringify(req.fieldMapping)}, ${req.duplicateHandling}, NOW(), NOW())
        RETURNING id
      `;

      if (!importRow) {
        throw new Error("Failed to create import job");
      }

      const importJobId = importRow.id;

      // Create import rows
      for (let i = 0; i < req.csvData.length; i++) {
        const rowData = req.csvData[i];
        const mappedData: Record<string, any> = {};
        
        // Map CSV columns to fields
        Object.entries(req.fieldMapping).forEach(([csvColumn, field]) => {
          const columnIndex = parseInt(csvColumn);
          if (columnIndex < rowData.length) {
            mappedData[field] = rowData[columnIndex];
          }
        });

        await tx.exec`
          INSERT INTO import_rows (import_job_id, row_number, raw_data, status)
          VALUES (${importJobId}, ${i + 1}, ${JSON.stringify(mappedData)}, 'pending')
        `;
      }

      // Update status to processing
      await tx.exec`
        UPDATE import_jobs 
        SET status = 'processing', updated_at = NOW()
        WHERE id = ${importJobId}
      `;

      await tx.commit();

      // Process the import asynchronously (in a real implementation, this would be a background job)
      processImport(importJobId);

      // Return the created import job
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
        SELECT * FROM import_jobs WHERE id = ${importJobId}
      `;

      if (!job) {
        throw new Error("Failed to fetch import job");
      }

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
      };

    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);

async function processImport(importJobId: number) {
  // This would typically be run as a background job
  setTimeout(async () => {
    const tx = await crmDB.begin();
    
    try {
      const importRows = await tx.queryAll<{
        id: number;
        row_number: number;
        raw_data: string;
      }>`
        SELECT id, row_number, raw_data 
        FROM import_rows 
        WHERE import_job_id = ${importJobId} AND status = 'pending'
        ORDER BY row_number
      `;

      let successCount = 0;
      let errorCount = 0;

      for (const row of importRows) {
        try {
          const data = JSON.parse(row.raw_data);
          
          // Create person if we have required data
          if (data.firstName || data.email) {
            const personRow = await tx.queryRow<{ id: number }>`
              INSERT INTO people (company_id, first_name, last_name, email, phone, job_title, created_at, updated_at)
              VALUES (1, ${data.firstName || ''}, ${data.lastName || null}, ${data.email || null}, ${data.phone || null}, ${data.jobTitle || null}, NOW(), NOW())
              RETURNING id
            `;

            if (personRow) {
              await tx.exec`
                UPDATE import_rows 
                SET status = 'success', person_id = ${personRow.id}
                WHERE id = ${row.id}
              `;
              successCount++;
            } else {
              throw new Error("Failed to create person");
            }
          } else {
            throw new Error("Missing required fields: firstName or email");
          }
        } catch (error) {
          await tx.exec`
            UPDATE import_rows 
            SET status = 'error', error_message = ${error instanceof Error ? error.message : 'Unknown error'}
            WHERE id = ${row.id}
          `;
          errorCount++;
        }
      }

      // Update import job status
      await tx.exec`
        UPDATE import_jobs 
        SET 
          status = 'completed',
          processed_rows = ${importRows.length},
          success_rows = ${successCount},
          error_rows = ${errorCount},
          updated_at = NOW()
        WHERE id = ${importJobId}
      `;

      await tx.commit();

    } catch (error) {
      await tx.rollback();
      
      // Mark import as failed
      await crmDB.exec`
        UPDATE import_jobs 
        SET 
          status = 'failed',
          error_log = ${error instanceof Error ? error.message : 'Unknown error'},
          updated_at = NOW()
        WHERE id = ${importJobId}
      `;
    }
  }, 1000); // Simulate processing delay
}
