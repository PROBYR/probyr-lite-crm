export interface CalendarConnectionRequest {
    userId: number;
    provider: 'google' | 'outlook' | 'caldav';
    oauthAccessToken?: string;
    oauthRefreshToken?: string;
    oauthTokenExpiresAt?: Date;
    caldavUrl?: string;
    caldavUsername?: string;
    caldavPassword?: string;
    primaryCalendarId?: string;
}
export interface CalendarConnection {
    id: number;
    userId: number;
    provider: string;
    primaryCalendarId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const connectCalendar: (params: CalendarConnectionRequest) => Promise<CalendarConnection>;
