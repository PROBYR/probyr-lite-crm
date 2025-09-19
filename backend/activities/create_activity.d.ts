export interface CreateActivityRequest {
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
}
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
}
export declare const createActivity: (params: CreateActivityRequest) => Promise<Activity>;
