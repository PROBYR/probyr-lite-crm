export interface GetPersonParams {
    id: number;
}
export interface Person {
    id: number;
    companyId?: number;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    status: string;
    lastContactedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    company?: {
        id: number;
        name: string;
    };
    tags: Array<{
        id: number;
        name: string;
        color: string;
    }>;
}
export declare const getPerson: (params: GetPersonParams) => Promise<Person>;
