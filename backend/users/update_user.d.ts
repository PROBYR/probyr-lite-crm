export interface UpdateUserParams {
    id: number;
}
export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: 'admin' | 'member';
    isActive?: boolean;
}
export interface User {
    id: number;
    companyId: number;
    email: string;
    firstName: string;
    lastName?: string;
    role: 'admin' | 'member';
    isActive: boolean;
}
export declare const updateUser: (params: UpdateUserParams & UpdateUserRequest) => Promise<User>;
