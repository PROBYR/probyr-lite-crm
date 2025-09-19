import { Query } from "encore.dev/api";
export interface Person {
    id: number;
    companyId?: number;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    status: string;
    assignedTo?: number;
    lastContactedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    company?: {
        id: number;
        name: string;
    };
    owner?: {
        id: number;
        firstName: string;
        lastName?: string;
        email: string;
    };
    tags: Array<{
        id: number;
        name: string;
        color: string;
    }>;
}
export interface ListPeopleParams {
    search?: Query<string>;
    tagIds?: Query<string>;
    sortBy?: Query<string>;
    sortOrder?: Query<string>;
    limit?: Query<number>;
    offset?: Query<number>;
}
export interface ListPeopleResponse {
    people: Person[];
    total: number;
}
export declare const listPeople: (params: ListPeopleParams) => Promise<ListPeopleResponse>;
