export interface CreateImportRequest {
    companyId: number;
    userId: number;
    filename: string;
    fieldMapping: Record<string, string>;
    duplicateHandling: 'skip' | 'merge' | 'create';
    csvData: string[][];
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
}
export declare const createImport: (params: CreateImportRequest) => Promise<ImportJob>;
