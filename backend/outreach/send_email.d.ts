export interface SendEmailRequest {
    personId: number;
    fromUserId: number;
    subject: string;
    body: string;
}
export interface Activity {
    id: number;
}
export declare const sendEmail: (params: SendEmailRequest) => Promise<Activity>;
