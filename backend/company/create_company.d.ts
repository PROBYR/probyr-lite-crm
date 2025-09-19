export interface CreateCompanyRequest {
    name: string;
    website?: string;
    industry?: string;
    address?: string;
    phone?: string;
}
export interface Company {
    id: number;
    name: string;
    website?: string;
    industry?: string;
    address?: string;
    phone?: string;
    bccEmail: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const createCompany: (params: CreateCompanyRequest) => Promise<Company>;
