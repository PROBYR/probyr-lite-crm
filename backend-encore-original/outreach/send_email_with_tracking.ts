import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface SendEmailWithTrackingRequest {
  personId: number;
  fromUserId: number;
  subject: string;
  body: string;
  trackOpens: boolean;
  trackClicks: boolean;
}

export interface EmailSentResponse {
  activityId: number;
  trackingId?: string;
}

// Sends an email with tracking capabilities and logs it as an activity.
export const sendEmailWithTracking = api<SendEmailWithTrackingRequest, EmailSentResponse>(
  { expose: true, method: "POST", path: "/outreach/emails/tracked" },
  async (req) => {
    try {
      // Generate tracking ID for email
      const trackingId = req.trackOpens || req.trackClicks 
        ? `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : undefined;

      // Get user's email signature
      const user = await crmDB.queryRow<{
        email_signature: string | null;
        email: string;
        first_name: string;
        last_name: string | null;
      }>`
        SELECT email_signature, email, first_name, last_name 
        FROM users WHERE id = ${req.fromUserId}
      `;

      if (!user) {
        throw new Error("User not found");
      }

      // Append signature to email body
      let finalBody = req.body;
      if (user.email_signature) {
        finalBody += `\n\n${user.email_signature}`;
      }

      // Process body for link tracking if enabled
      let processedBody = finalBody;
      if (req.trackClicks && trackingId) {
        // Replace all links with tracking links
        processedBody = finalBody.replace(
          /(https?:\/\/[^\s<>"]+)/gi,
          `${process.env.ENCORE_ENDPOINT || 'http://localhost:4000'}/track/click/${trackingId}?url=$1`
        );
      }

      // Add tracking pixel if enabled
      if (req.trackOpens && trackingId) {
        processedBody += `\n<img src="${process.env.ENCORE_ENDPOINT || 'http://localhost:4000'}/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
      }

      // In a real app, this would integrate with the user's connected email service
      // For demo purposes, we'll just log the email
      console.log(`Sending email to person ${req.personId}:`);
      console.log(`From: ${user.first_name} ${user.last_name || ''} <${user.email}>`);
      console.log(`Subject: ${req.subject}`);
      console.log(`Body: ${processedBody}`);

      // Create activity record
      const activity = await crmDB.queryRow<{ id: number }>`
        INSERT INTO activities (
          company_id, person_id, user_id, activity_type, title, 
          email_subject, email_body, metadata, created_at
        )
        VALUES (
          1, -- Demo company
          ${req.personId}, 
          ${req.fromUserId}, 
          'email', 
          'Sales Email Sent', 
          ${req.subject}, 
          ${finalBody},
          ${JSON.stringify({ 
            trackingId, 
            trackOpens: req.trackOpens, 
            trackClicks: req.trackClicks,
            originalBody: req.body
          })},
          NOW()
        )
        RETURNING id
      `;

      if (!activity) {
        throw new Error("Failed to log email activity");
      }

      return {
        activityId: activity.id,
        trackingId,
      };
    } catch (error) {
      console.error('Error in sendEmailWithTracking:', error);
      throw error;
    }
  }
);
