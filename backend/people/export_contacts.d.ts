export interface ExportContactsRequest {
    personIds: number[];
}
export interface ExportContactsResponse {
    csvData: string;
    filename: string;
}
export declare const exportContacts: (params: ExportContactsRequest) => Promise<ExportContactsResponse>;
