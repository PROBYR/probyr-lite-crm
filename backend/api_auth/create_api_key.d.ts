export interface CreateApiKeyRequest {
    companyId: number;
    name: string;
    description?: string;
    permissions: string[];
}
export interface ApiKey {
    id: number;
    companyId: number;
    name: string;
    description?: string;
    keyPrefix: string;
    permissions: string[];
    isActive: boolean;
    createdAt: Date;
}
export interface CreateApiKeyResponse {
    apiKey: ApiKey;
    fullKey: string;
}
export declare const createApiKey: (params: CreateApiKeyRequest) => Promise<CreateApiKeyResponse>;
