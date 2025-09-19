import { Query } from "encore.dev/api";
export interface Activity {
    id: number;
    companyId: number;
    userId?: number;
    personId?: number;
    dealId?: number;
    activityType: string;
    title: string;
    description?: string;
    emailSubject?: string;
    emailBody?: string;
    metadata?: any;
    createdAt: Date;
    user?: {
        id: number;
        firstName: string;
        lastName?: string;
        email: string;
    };
    person?: {
        id: number;
        firstName: string;
        lastName?: string;
    };
    deal?: {
        id: number;
        title: string;
    };
}
export interface ListActivitiesParams {
    personId?: Query<number>;
    dealId?: Query<number>;
    activityType?: Query<string>;
    limit?: Query<number>;
    offset?: Query<number>;
}
export interface ListActivitiesResponse {
    activities: Activity[];
    total: number;
}
export declare const listActivities: (params: ListActivitiesParams) => Promise<ListActivitiesResponse>;
