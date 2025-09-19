import { Query } from "encore.dev/api";
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
export interface ListApiKeysParams {
    companyId?: Query<number>;
}
export interface ListApiKeysResponse {
    apiKeys: ApiKey[];
}
export declare const listApiKeysWithPermissions: (params: ListApiKeysParams) => Promise<ListApiKeysResponse>;
