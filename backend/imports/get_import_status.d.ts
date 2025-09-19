export interface GetImportStatusParams {
    id: number;
}
export interface ImportJob {
    id: number;
    companyId: number;
    userId: number;
    filename: string;
    status: string;
    totalRows: number;
    processedRows: number;
    successRows: number;
    errorRows: number;
    fieldMapping: Record<string, string>;
    duplicateHandling: string;
    errorLog?: string;
    createdAt: Date;
    updatedAt: Date;
    progress: number;
}
export declare const getImportStatus: (params: GetImportStatusParams) => Promise<ImportJob>;
