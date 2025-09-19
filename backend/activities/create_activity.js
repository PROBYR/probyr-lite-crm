import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Creates a new activity record.
export const createActivity = api({ expose: true, method: "POST", path: "/activities" }, async (req) => {
    try {
        const activityRow = await crmDB.queryRow `
        INSERT INTO activities (
          company_id, user_id, person_id, deal_id, activity_type, title, 
          description, email_subject, email_body, metadata, created_at
        )
        VALUES (
          ${req.companyId}, ${req.userId || null}, ${req.personId || null}, 
          ${req.dealId || null}, ${req.activityType}, ${req.title}, 
          ${req.description || null}, ${req.emailSubject || null}, 
          ${req.emailBody || null}, ${JSON.stringify(req.metadata || {})}, NOW()
        )
        RETURNING *
      `;
        if (!activityRow) {
            throw new Error("Failed to create activity");
        }
        return {
            id: activityRow.id,
            companyId: activityRow.company_id,
            userId: activityRow.user_id || undefined,
            personId: activityRow.person_id || undefined,
            dealId: activityRow.deal_id || undefined,
            activityType: activityRow.activity_type,
            title: activityRow.title,
            description: activityRow.description || undefined,
            emailSubject: activityRow.email_subject || undefined,
            emailBody: activityRow.email_body || undefined,
            metadata: activityRow.metadata || undefined,
            createdAt: activityRow.created_at,
        };
    }
    catch (error) {
        console.error('Error in createActivity:', error);
        throw error;
    }
});
//# sourceMappingURL=create_activity.js.map