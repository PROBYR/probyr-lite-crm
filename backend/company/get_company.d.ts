export interface GetCompanyParams {
    id: number;
}
export interface Company {
    id: number;
    name: string;
    website?: string;
    phone?: string;
    address?: string;
    bccEmail: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const getCompany: (params: GetCompanyParams) => Promise<Company>;
