export interface BulkTagUpdateRequest {
    personIds: number[];
    tagIds: number[];
    operation: 'add' | 'remove';
}
export interface BulkTagUpdateResponse {
    updatedCount: number;
}
export declare const bulkTagUpdate: (params: BulkTagUpdateRequest) => Promise<BulkTagUpdateResponse>;
