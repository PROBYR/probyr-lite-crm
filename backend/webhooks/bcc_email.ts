import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface BCCEmailRequest {
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp: Date;
  bccAddress: string;
}

export interface BCCEmailResponse {
  processed: boolean;
  personId?: number;
  activityId?: number;
}

// Processes incoming BCC emails and creates activity records.
export const processBCCEmail = api<BCCEmailRequest, BCCEmailResponse>(
  { expose: true, method: "POST", path: "/webhooks/bcc-email" },
  async (req) => {
    // Extract company from BCC address (format: companyId-hash@inbound.probyr.example)
    const bccParts = req.bccAddress.split('@')[0].split('-');
    const companyId = bccParts[0] === 'demo' ? 1 : parseInt(bccParts[0]);

    // Find person by email address (from sender or recipients)
    const emailAddresses = [req.from, ...req.to];
    let personId: number | null = null;

    for (const email of emailAddresses) {
      const person = await crmDB.queryRow<{ id: number; company_id: number }>`
        SELECT id, company_id FROM people 
        WHERE email = ${email} AND company_id = ${companyId}
      `;
      
      if (person) {
        personId = person.id;
        break;
      }
    }

    let activityId: number | null = null;

    if (personId) {
      // Create activity record
      const activity = await crmDB.queryRow<{ id: number }>`
        INSERT INTO activities (
          company_id, person_id, activity_type, title, description, 
          email_subject, email_body, created_at
        ) VALUES (
          ${companyId}, ${personId}, 'email', 'Email Communication', 
          'Email received via BCC', ${req.subject}, ${req.body}, ${req.timestamp}
        )
        RETURNING id
      `;

      if (activity) {
        activityId = activity.id;
      }

      // Update last contacted date
      await crmDB.exec`
        UPDATE people 
        SET last_contacted_at = ${req.timestamp}, updated_at = NOW()
        WHERE id = ${personId}
      `;
    }

    return {
      processed: true,
      personId: personId || undefined,
      activityId: activityId || undefined,
    };
  }
);
