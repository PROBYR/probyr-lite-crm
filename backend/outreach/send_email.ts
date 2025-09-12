import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface SendEmailRequest {
  personId: number;
  fromUserId: number;
  subject: string;
  body: string;
}

export interface Activity {
  id: number;
}

// Sends a one-to-one sales email and logs it as an activity.
export const sendEmail = api<SendEmailRequest, Activity>(
  { expose: true, method: "POST", path: "/outreach/emails" },
  async (req) => {
    // In a real app, this would integrate with an email sending service (e.g., SendGrid, or user's connected mailbox)
    // and would include tracking pixels/links.
    
    const activity = await crmDB.queryRow<{ id: number }>`
      INSERT INTO activities (company_id, person_id, user_id, activity_type, title, email_subject, email_body, created_at)
      VALUES (
        1, -- Assuming demo company 1
        ${req.personId}, 
        ${req.fromUserId}, 
        'email', 
        'Sales Email Sent', 
        ${req.subject}, 
        ${req.body},
        NOW()
      )
      RETURNING id
    `;

    if (!activity) {
      throw new Error("Failed to log email activity");
    }

    return activity;
  }
);
