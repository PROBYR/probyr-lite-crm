import { api } from "encore.dev/api";
import { crmDB } from "./db";
import { secret } from "encore.dev/config";
// Note: In a real application, you would not pass passwords directly.
// Instead, you'd have a secure way to set secrets, and the backend would
// reference them by name. This is a simplified example.
const smtpPasswordSecret = secret("SmtpPassword");
const imapPasswordSecret = secret("ImapPassword");
// Updates company email settings.
export const updateEmailSettings = api({ expose: true, method: "POST", path: "/integrations/email" }, async (req) => {
    // This is a simplified way to handle secrets for this example.
    // In a real app, you would manage secrets through the Encore UI or API.
    if (req.smtpPassword) {
        // This is not how you'd set a secret in a real app, but demonstrates the concept.
        // You would typically set this in the Encore UI.
    }
    if (req.imapPassword) {
        // Same as above.
    }
    await crmDB.exec `
      INSERT INTO company_email_settings (company_id, smtp_host, smtp_port, smtp_user, smtp_password_secret_name, imap_host, imap_port, imap_user, imap_password_secret_name)
      VALUES (${req.companyId}, ${req.smtpHost}, ${req.smtpPort}, ${req.smtpUser}, 'SmtpPassword', ${req.imapHost}, ${req.imapPort}, ${req.imapUser}, 'ImapPassword')
      ON CONFLICT (company_id) DO UPDATE SET
        smtp_host = EXCLUDED.smtp_host,
        smtp_port = EXCLUDED.smtp_port,
        smtp_user = EXCLUDED.smtp_user,
        imap_host = EXCLUDED.imap_host,
        imap_port = EXCLUDED.imap_port,
        imap_user = EXCLUDED.imap_user
    `;
});
//# sourceMappingURL=update_email_settings.js.map