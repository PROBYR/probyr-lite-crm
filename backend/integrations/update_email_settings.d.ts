export interface UpdateEmailSettingsRequest {
    companyId: number;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    imapHost?: string;
    imapPort?: number;
    imapUser?: string;
    imapPassword?: string;
}
export declare const updateEmailSettings: (params: UpdateEmailSettingsRequest) => Promise<void>;
