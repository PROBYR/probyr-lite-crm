export interface EmailSettings {
    companyId: number;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    imapHost?: string;
    imapPort?: number;
    imapUser?: string;
}
export declare const getEmailSettings: () => Promise<EmailSettings>;
