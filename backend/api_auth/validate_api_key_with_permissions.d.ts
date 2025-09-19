export interface ValidateApiKeyWithPermissionsRequest {
    key: string;
}
export interface ValidateApiKeyWithPermissionsResponse {
    isValid: boolean;
    companyId?: number;
    keyName?: string;
    permissions?: string[];
}
export declare const validateApiKeyWithPermissions: (params: ValidateApiKeyWithPermissionsRequest) => Promise<ValidateApiKeyWithPermissionsResponse>;
