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
export declare const sendEmailWithTracking: (params: SendEmailWithTrackingRequest) => Promise<EmailSentResponse>;
