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
export interface ListCompaniesResponse {
    companies: Company[];
}
export declare const listCompanies: () => Promise<ListCompaniesResponse>;
