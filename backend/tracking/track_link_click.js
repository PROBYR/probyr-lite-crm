import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Tracks when a link in an email is clicked and redirects to the original URL.
export const trackLinkClick = api({ expose: true, method: "GET", path: "/track/click/:trackingId" }, async (params) => {
    try {
        // Find the activity with this tracking ID
        const activity = await crmDB.queryRow `
        SELECT id, person_id, user_id, metadata
        FROM activities 
        WHERE activity_type = 'email' 
        AND metadata->>'trackingId' = ${params.trackingId}
      `;
        if (activity) {
            // Log the link click
            await crmDB.exec `
          INSERT INTO activities (
            company_id, person_id, user_id, activity_type, title, 
            description, metadata, created_at
          )
          VALUES (
            1, -- Demo company
            ${activity.person_id}, 
            ${activity.user_id}, 
            'link_click', 
            'Link Clicked', 
            'Clicked link in email: ${params.url}',
            ${JSON.stringify({
                originalActivityId: activity.id,
                trackingId: params.trackingId,
                clickedUrl: params.url,
                clickedAt: new Date().toISOString()
            })},
            NOW()
          )
        `;
            console.log(`Link click tracked for activity ${activity.id}: ${params.url}`);
        }
        // In a real implementation, this would be an HTTP redirect to the original URL
        // For this demo, we'll just log it
        console.log(`Redirecting to: ${params.url}`);
    }
    catch (error) {
        console.error('Error tracking link click:', error);
        // Still redirect even if tracking fails
    }
});
//# sourceMappingURL=track_link_click.js.map