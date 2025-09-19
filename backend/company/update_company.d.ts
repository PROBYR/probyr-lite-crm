export interface UpdateCompanyParams {
    id: number;
}
export interface UpdateCompanyRequest {
    name?: string;
    website?: string;
    phone?: string;
    address?: string;
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
export declare const updateCompany: (params: UpdateCompanyParams & UpdateCompanyRequest) => Promise<Company>;
