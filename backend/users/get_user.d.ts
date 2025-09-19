export interface GetUserParams {
    id: number;
}
export interface User {
    id: number;
    companyId: number;
    email: string;
    firstName: string;
    lastName?: string;
    role: 'admin' | 'member';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const getUser: (params: GetUserParams) => Promise<User>;
