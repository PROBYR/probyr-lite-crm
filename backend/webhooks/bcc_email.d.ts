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
export declare const processBCCEmail: (params: BCCEmailRequest) => Promise<BCCEmailResponse>;
