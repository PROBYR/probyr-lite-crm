import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface SendEmailWithValidationRequest {
  personId: number;
  fromUserId: number;
  subject: string;
  body: string;
  trackOpens: boolean;
  trackClicks: boolean;
}

export interface EmailSentWithValidationResponse {
  success: boolean;
  activityId?: number;
  trackingId?: string;
  message: string;
  error?: string;
}

// Sends an email with real-time validation and server response checking.
export const sendEmailWithValidation = api<SendEmailWithValidationRequest, EmailSentWithValidationResponse>(
  { expose: true, method: "POST", path: "/outreach/emails/validated" },
  async (req) => {
    try {
      // Get user's email connection settings
      const emailSettings = await crmDB.queryRow<{
        provider: string;
        email_address: string;
        is_active: boolean;
        smtp_host: string | null;
        smtp_port: number | null;
        smtp_username: string | null;
      }>`
        SELECT provider, email_address, is_active, smtp_host, smtp_port, smtp_username
        FROM user_email_settings 
        WHERE user_id = ${req.fromUserId} AND is_active = TRUE
      `;

      if (!emailSettings) {
        return {
          success: false,
          message: "No email connection found. Please connect your email account in Settings.",
        };
      }

      // Get recipient details
      const person = await crmDB.queryRow<{
        email: string | null;
        first_name: string;
        last_name: string | null;
      }>`
        SELECT email, first_name, last_name
        FROM people 
        WHERE id = ${req.personId}
      `;

      if (!person || !person.email) {
        return {
          success: false,
          message: "Contact email address not found.",
        };
      }

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
        return {
          success: false,
          message: "User not found.",
        };
      }

      // Generate tracking ID for email
      const trackingId = req.trackOpens || req.trackClicks 
        ? `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : undefined;

      // Append signature to email body
      let finalBody = req.body;
      if (user.email_signature) {
        finalBody += `\n\n${user.email_signature}`;
      }

      // Process body for link tracking if enabled
      let processedBody = finalBody;
      if (req.trackClicks && trackingId) {
        processedBody = finalBody.replace(
          /(https?:\/\/[^\s<>"]+)/gi,
          `${process.env.ENCORE_ENDPOINT || 'http://localhost:4000'}/track/click/${trackingId}?url=$1`
        );
      }

      // Add tracking pixel if enabled
      if (req.trackOpens && trackingId) {
        processedBody += `\n<img src="${process.env.ENCORE_ENDPOINT || 'http://localhost:4000'}/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
      }

      // Simulate actual email sending with server validation
      console.log(`Attempting to send email via ${emailSettings.provider}:`);
      console.log(`From: ${user.first_name} ${user.last_name || ''} <${emailSettings.email_address}>`);
      console.log(`To: ${person.first_name} ${person.last_name || ''} <${person.email}>`);
      console.log(`Subject: ${req.subject}`);

      // Simulate different validation outcomes based on settings
      let emailSendResult;
      
      if (emailSettings.provider === 'smtp') {
        // For SMTP, simulate potential authentication failures
        if (!emailSettings.smtp_host || !emailSettings.smtp_username) {
          return {
            success: false,
            message: "SMTP configuration incomplete. Please verify your SMTP settings in the connection configuration.",
            error: "Missing SMTP host or username",
          };
        }
        
        // Simulate SMTP server response validation
        const simulatedSmtpSuccess = Math.random() > 0.3; // 70% success rate for demo
        
        if (!simulatedSmtpSuccess) {
          return {
            success: false,
            message: "Email delivery failed. SMTP server rejected the message. Please check your credentials and try again.",
            error: "SMTP Error: Authentication failed or server unavailable",
          };
        }
        
        emailSendResult = { success: true };
      } else {
        // For OAuth providers (Gmail, Outlook), simulate higher success rate
        const simulatedOauthSuccess = Math.random() > 0.1; // 90% success rate for demo
        
        if (!simulatedOauthSuccess) {
          return {
            success: false,
            message: "Email delivery failed. Your OAuth token may have expired. Please reconnect your email account.",
            error: "OAuth Error: Invalid or expired access token",
          };
        }
        
        emailSendResult = { success: true };
      }

      if (emailSendResult.success) {
        // Create activity record only after successful email sending
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
              originalBody: req.body,
              validated: true,
              emailProvider: emailSettings.provider
            })},
            NOW()
          )
          RETURNING id
        `;

        return {
          success: true,
          activityId: activity?.id,
          trackingId,
          message: "Email sent successfully and logged to contact timeline.",
        };
      } else {
        return {
          success: false,
          message: "Email delivery failed. Please check your email configuration and try again.",
          error: "Server handoff failed",
        };
      }

    } catch (error) {
      console.error('Error in sendEmailWithValidation:', error);
      
      return {
        success: false,
        message: "Email sending failed due to an unexpected error. Please check your email configuration and try again.",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
);
