export interface GetEmailSignatureParams {
    userId: number;
}
export interface EmailSignatureResponse {
    signature: string;
}
export declare const getEmailSignature: (params: GetEmailSignatureParams) => Promise<EmailSignatureResponse>;
