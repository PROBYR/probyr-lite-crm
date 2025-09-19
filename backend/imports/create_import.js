import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Creates a new import job and processes the CSV data.
export const createImport = api({ expose: true, method: "POST", path: "/imports" }, async (req) => {
    const tx = await crmDB.begin();
    try {
        // Create import job
        const importRow = await tx.queryRow `
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
            const mappedData = {};
            // Map CSV columns to fields
            Object.entries(req.fieldMapping).forEach(([csvColumn, field]) => {
                const columnIndex = parseInt(csvColumn);
                if (columnIndex < rowData.length) {
                    mappedData[field] = rowData[columnIndex];
                }
            });
            await tx.exec `
          INSERT INTO import_rows (import_job_id, row_number, raw_data, status)
          VALUES (${importJobId}, ${i + 1}, ${JSON.stringify(mappedData)}, 'pending')
        `;
        }
        // Update status to processing
        await tx.exec `
        UPDATE import_jobs 
        SET status = 'processing', updated_at = NOW()
        WHERE id = ${importJobId}
      `;
        await tx.commit();
        // Process the import asynchronously
        processImport(importJobId);
        // Return the created import job
        const job = await crmDB.queryRow `
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
    }
    catch (error) {
        await tx.rollback();
        throw error;
    }
});
async function processImport(importJobId) {
    try {
        const job = await crmDB.queryRow `
      SELECT company_id, duplicate_handling FROM import_jobs WHERE id = ${importJobId}
    `;
        if (!job) {
            throw new Error(`Import job ${importJobId} not found.`);
        }
        const { company_id: companyId, duplicate_handling: duplicateHandling } = job;
        const importRows = await crmDB.queryAll `
      SELECT id, row_number, raw_data 
      FROM import_rows 
      WHERE import_job_id = ${importJobId} AND status = 'pending'
      ORDER BY row_number
    `;
        let successCount = 0;
        let errorCount = 0;
        let processedCount = 0;
        for (const row of importRows) {
            const tx = await crmDB.begin();
            try {
                const data = JSON.parse(row.raw_data);
                if (!data.firstName && !data.email) {
                    throw new Error("Missing required fields: firstName or email");
                }
                const existingPerson = data.email ? await tx.queryRow `
          SELECT id FROM people WHERE email = ${data.email} AND company_id = ${companyId}
        ` : null;
                if (existingPerson) {
                    if (duplicateHandling === 'skip') {
                        await tx.exec `UPDATE import_rows SET status = 'skipped', person_id = ${existingPerson.id}, error_message = 'Duplicate email (skipped)' WHERE id = ${row.id}`;
                    }
                    else if (duplicateHandling === 'merge') {
                        await tx.exec `
              UPDATE people SET
                first_name = ${data.firstName || ''},
                last_name = ${data.lastName || null},
                phone = ${data.phone || null},
                job_title = ${data.jobTitle || null},
                updated_at = NOW()
              WHERE id = ${existingPerson.id}
            `;
                        await tx.exec `UPDATE import_rows SET status = 'success', person_id = ${existingPerson.id}, error_message = 'Merged with existing contact' WHERE id = ${row.id}`;
                        successCount++;
                    }
                    else { // 'create'
                        const personRow = await tx.queryRow `
              INSERT INTO people (company_id, first_name, last_name, email, phone, job_title, created_at, updated_at)
              VALUES (${companyId}, ${data.firstName || ''}, ${data.lastName || null}, ${data.email || null}, ${data.phone || null}, ${data.jobTitle || null}, NOW(), NOW())
              RETURNING id
            `;
                        if (!personRow)
                            throw new Error("Failed to create person (possibly due to unique constraint on email)");
                        await tx.exec `UPDATE import_rows SET status = 'success', person_id = ${personRow.id} WHERE id = ${row.id}`;
                        successCount++;
                    }
                }
                else {
                    const personRow = await tx.queryRow `
            INSERT INTO people (company_id, first_name, last_name, email, phone, job_title, created_at, updated_at)
            VALUES (${companyId}, ${data.firstName || ''}, ${data.lastName || null}, ${data.email || null}, ${data.phone || null}, ${data.jobTitle || null}, NOW(), NOW())
            RETURNING id
          `;
                    if (!personRow)
                        throw new Error("Failed to create person");
                    await tx.exec `UPDATE import_rows SET status = 'success', person_id = ${personRow.id} WHERE id = ${row.id}`;
                    successCount++;
                }
                await tx.commit();
            }
            catch (error) {
                await tx.rollback();
                await crmDB.exec `
          UPDATE import_rows 
          SET status = 'error', error_message = ${error instanceof Error ? error.message : 'Unknown error'}
          WHERE id = ${row.id}
        `;
                errorCount++;
            }
            processedCount++;
            await crmDB.exec `
        UPDATE import_jobs
        SET processed_rows = ${processedCount}
        WHERE id = ${importJobId}
      `;
        }
        await crmDB.exec `
      UPDATE import_jobs 
      SET 
        status = 'completed',
        success_rows = ${successCount},
        error_rows = ${errorCount},
        updated_at = NOW()
      WHERE id = ${importJobId}
    `;
    }
    catch (error) {
        await crmDB.exec `
      UPDATE import_jobs 
      SET 
        status = 'failed',
        error_log = ${error instanceof Error ? error.message : 'Unknown error'},
        updated_at = NOW()
      WHERE id = ${importJobId}
    `;
    }
}
//# sourceMappingURL=create_import.js.map