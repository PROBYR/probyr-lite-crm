import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Books a meeting and logs it as an activity.
export const bookMeeting = api({ expose: true, method: "POST", path: "/outreach/meetings" }, async (req) => {
    // In a real app, this would integrate with a calendar API (Google, Outlook)
    const activity = await crmDB.queryRow `
      INSERT INTO activities (company_id, person_id, user_id, activity_type, title, description, metadata, created_at)
      VALUES (
        1, -- Assuming demo company 1
        ${req.personId}, 
        ${req.userId}, 
        'meeting', 
        ${req.title}, 
        ${req.description || null},
        ${JSON.stringify({ startTime: req.startTime, endTime: req.endTime })},
        NOW()
      )
      RETURNING id
    `;
    if (!activity) {
        throw new Error("Failed to log meeting activity");
    }
    return activity;
});
//# sourceMappingURL=book_meeting.js.map