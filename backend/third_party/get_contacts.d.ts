import { Header } from "encore.dev/api";
import { Query } from "encore.dev/api";
export interface Contact {
    id: number;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    status: string;
    company?: {
        id: number;
        name: string;
        website?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface GetContactsParams {
    authorization: Header<"Authorization">;
    limit?: Query<number>;
    offset?: Query<number>;
}
export interface GetContactsResponse {
    contacts: Contact[];
    total: number;
}
export declare const getContacts: (params: GetContactsParams) => Promise<GetContactsResponse>;
