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
export declare const sendEmailWithValidation: (params: SendEmailWithValidationRequest) => Promise<EmailSentWithValidationResponse>;
