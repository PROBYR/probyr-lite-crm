export interface DeleteContactsRequest {
    personIds: number[];
}
export interface DeleteContactsResponse {
    deletedCount: number;
}
export declare const deleteContacts: (params: DeleteContactsRequest) => Promise<DeleteContactsResponse>;
