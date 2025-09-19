export interface DeactivateUsersRequest {
    userIds: number[];
}
export interface DeactivateUsersResponse {
    deactivatedCount: number;
    skippedCount: number;
}
export declare const deactivateUsers: (params: DeactivateUsersRequest) => Promise<DeactivateUsersResponse>;
