import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Tracks when an email is opened.
export const trackEmailOpen = api({ expose: true, method: "GET", path: "/track/open/:trackingId" }, async (params) => {
    try {
        // Find the activity with this tracking ID
        const activity = await crmDB.queryRow `
        SELECT id, person_id, user_id, metadata
        FROM activities 
        WHERE activity_type = 'email' 
        AND metadata->>'trackingId' = ${params.trackingId}
      `;
        if (!activity) {
            console.warn(`No activity found for tracking ID: ${params.trackingId}`);
            return;
        }
        // Check if this open has already been tracked
        const existingOpen = await crmDB.queryRow `
        SELECT id FROM activities 
        WHERE activity_type = 'email_open' 
        AND metadata->>'originalActivityId' = ${activity.id.toString()}
      `;
        if (existingOpen) {
            console.log(`Email open already tracked for activity ${activity.id}`);
            return;
        }
        // Log the email open
        await crmDB.exec `
        INSERT INTO activities (
          company_id, person_id, user_id, activity_type, title, 
          description, metadata, created_at
        )
        VALUES (
          1, -- Demo company
          ${activity.person_id}, 
          ${activity.user_id}, 
          'email_open', 
          'Email Opened', 
          'Recipient opened the email',
          ${JSON.stringify({
            originalActivityId: activity.id,
            trackingId: params.trackingId,
            openedAt: new Date().toISOString()
        })},
          NOW()
        )
      `;
        console.log(`Email open tracked for activity ${activity.id}`);
    }
    catch (error) {
        console.error('Error tracking email open:', error);
        // Don't throw error as this is a tracking pixel request
    }
});
//# sourceMappingURL=track_email_open.js.map