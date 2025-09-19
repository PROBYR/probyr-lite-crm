export interface DeleteUsersRequest {
    userIds: number[];
}
export declare const deleteUsers: (params: DeleteUsersRequest) => Promise<void>;
