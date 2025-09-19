import { Header } from "encore.dev/api";
export interface CreateLeadRequest {
    contact: {
        fullName: string;
        email: string;
        title?: string;
        companyName: string;
        companyWebsite?: string;
    };
    deal: {
        dealName: string;
        value?: number;
        pipelineName: string;
        stageName: string;
    };
    note: {
        content: string;
    };
}
export interface CreateLeadParams {
    authorization: Header<"Authorization">;
}
export interface CreateLeadResponse {
    success: boolean;
    contactId: number;
    companyId: number;
    dealId: number;
    message: string;
}
export declare const createLead: (params: CreateLeadParams & CreateLeadRequest) => Promise<CreateLeadResponse>;
