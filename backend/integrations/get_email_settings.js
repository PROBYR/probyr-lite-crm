import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves company email settings.
export const getEmailSettings = api({ expose: true, method: "GET", path: "/integrations/email" }, async () => {
    const settings = await crmDB.queryRow `
      SELECT company_id, smtp_host, smtp_port, smtp_user, imap_host, imap_port, imap_user
      FROM company_email_settings
      WHERE company_id = 1 -- Assuming demo company
    `;
    return {
        companyId: settings?.company_id || 1,
        smtpHost: settings?.smtp_host || undefined,
        smtpPort: settings?.smtp_port || undefined,
        smtpUser: settings?.smtp_user || undefined,
        imapHost: settings?.imap_host || undefined,
        imapPort: settings?.imap_port || undefined,
        imapUser: settings?.imap_user || undefined,
    };
});
//# sourceMappingURL=get_email_settings.js.map