import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Processes form submissions and creates person and deal records.
export const processFormSubmission = api({ expose: true, method: "POST", path: "/webhooks/form-submission" }, async (req) => {
    const companyId = 1; // Default to demo company
    const tx = await crmDB.begin();
    try {
        // Check if person already exists
        let person = await tx.queryRow `
        SELECT id FROM people WHERE email = ${req.email} AND company_id = ${companyId}
      `;
        let personId;
        let created = false;
        if (person) {
            personId = person.id;
            // Update existing person
            await tx.exec `
          UPDATE people 
          SET 
            first_name = ${req.firstName},
            last_name = ${req.lastName || null},
            phone = ${req.phone || null},
            updated_at = NOW()
          WHERE id = ${personId}
        `;
        }
        else {
            // Create new person
            const newPerson = await tx.queryRow `
          INSERT INTO people (company_id, first_name, last_name, email, phone, created_at, updated_at)
          VALUES (${companyId}, ${req.firstName}, ${req.lastName || null}, ${req.email}, ${req.phone || null}, NOW(), NOW())
          RETURNING id
        `;
            if (!newPerson) {
                throw new Error("Failed to create person");
            }
            personId = newPerson.id;
            created = true;
        }
        // Get the first stage ID for deals
        const firstStage = await tx.queryRow `
        SELECT id FROM deal_stages 
        WHERE company_id = ${companyId} 
        ORDER BY position 
        LIMIT 1
      `;
        if (!firstStage) {
            throw new Error("No deal stages found");
        }
        // Create deal
        const dealTitle = `${req.firstName} ${req.lastName || ''} - ${req.source || 'Form Submission'}`.trim();
        const deal = await tx.queryRow `
        INSERT INTO deals (company_id, person_id, stage_id, title, notes, created_at, updated_at)
        VALUES (
          ${companyId}, 
          ${personId}, 
          ${firstStage.id}, 
          ${dealTitle},
          ${JSON.stringify(req.meta || {})},
          NOW(), 
          NOW()
        )
        RETURNING id
      `;
        if (!deal) {
            throw new Error("Failed to create deal");
        }
        // Create activity log
        await tx.exec `
        INSERT INTO activities (
          company_id, person_id, deal_id, activity_type, title, description, metadata, created_at
        ) VALUES (
          ${companyId}, ${personId}, ${deal.id}, 'form_submission', 
          'Form Submission', 'Lead captured from form submission', 
          ${JSON.stringify(req)}, NOW()
        )
      `;
        await tx.commit();
        return {
            personId,
            dealId: deal.id,
            created,
        };
    }
    catch (error) {
        await tx.rollback();
        throw error;
    }
});
//# sourceMappingURL=forms_integration.js.map