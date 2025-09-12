import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface EmailSettings {
  companyId: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
}

// Retrieves company email settings.
export const getEmailSettings = api<void, EmailSettings>(
  { expose: true, method: "GET", path: "/integrations/email" },
  async () => {
    const settings = await crmDB.queryRow<{
      company_id: number;
      smtp_host: string | null;
      smtp_port: number | null;
      smtp_user: string | null;
      imap_host: string | null;
      imap_port: number | null;
      imap_user: string | null;
    }>`
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
  }
);
