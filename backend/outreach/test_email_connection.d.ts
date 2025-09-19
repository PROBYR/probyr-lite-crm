export interface TestEmailConnectionRequest {
    userId: number;
}
export interface TestEmailConnectionResponse {
    success: boolean;
    message: string;
    error?: string;
}
export declare const testEmailConnection: (params: TestEmailConnectionRequest) => Promise<TestEmailConnectionResponse>;
