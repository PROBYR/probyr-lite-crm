export interface GetUserConnectionsParams {
    userId: number;
}
export interface UserConnections {
    email?: {
        id: number;
        provider: string;
        emailAddress: string;
        isActive: boolean;
    };
    calendar?: {
        id: number;
        provider: string;
        primaryCalendarId?: string;
        isActive: boolean;
    };
}
export declare const getUserConnections: (params: GetUserConnectionsParams) => Promise<UserConnections>;
