export interface User {
    id: number;
    companyId: number;
    email: string;
    firstName: string;
    lastName?: string;
    role: 'admin' | 'member';
    isActive: boolean;
    createdAt: Date;
}
export interface ListUsersResponse {
    users: User[];
}
export declare const listUsers: () => Promise<ListUsersResponse>;
