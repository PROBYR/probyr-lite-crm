export interface EmailConnectionRequest {
    userId: number;
    provider: 'gmail' | 'outlook' | 'smtp';
    emailAddress: string;
    oauthAccessToken?: string;
    oauthRefreshToken?: string;
    oauthTokenExpiresAt?: Date;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    imapHost?: string;
    imapPort?: number;
    imapUsername?: string;
    imapPassword?: string;
}
export interface EmailConnection {
    id: number;
    userId: number;
    provider: string;
    emailAddress: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const connectEmail: (params: EmailConnectionRequest) => Promise<EmailConnection>;
