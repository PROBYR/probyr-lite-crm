export interface FormSubmissionRequest {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    company?: string;
    source?: string;
    meta?: Record<string, any>;
}
export interface FormSubmissionResponse {
    personId: number;
    dealId: number;
    created: boolean;
}
export declare const processFormSubmission: (params: FormSubmissionRequest) => Promise<FormSubmissionResponse>;
