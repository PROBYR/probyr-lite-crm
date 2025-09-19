export interface InviteUserRequest {
    companyId: number;
    email: string;
    firstName: string;
    lastName?: string;
    role: 'admin' | 'member';
}
export interface InviteUserResponse {
    success: boolean;
    userId: number;
}
export declare const inviteUser: (params: InviteUserRequest) => Promise<InviteUserResponse>;
