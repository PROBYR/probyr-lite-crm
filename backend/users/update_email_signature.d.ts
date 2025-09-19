export interface UpdateEmailSignatureParams {
    userId: number;
}
export interface UpdateEmailSignatureRequest {
    signature: string;
}
export declare const updateEmailSignature: (params: UpdateEmailSignatureParams & UpdateEmailSignatureRequest) => Promise<void>;
