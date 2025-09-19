export interface AssignOwnerRequest {
    personIds: number[];
    userId?: number;
}
export interface AssignOwnerResponse {
    updatedCount: number;
}
export declare const assignOwner: (params: AssignOwnerRequest) => Promise<AssignOwnerResponse>;
