import { Query } from "encore.dev/api";
export interface Deal {
    id: number;
    companyId: number;
    personId?: number;
    stageId: number;
    title: string;
    value?: number;
    expectedCloseDate?: Date;
    probability: number;
    lossReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    person?: {
        id: number;
        firstName: string;
        lastName?: string;
        email?: string;
    };
    stage: {
        id: number;
        name: string;
        position: number;
        isWon: boolean;
        isLost: boolean;
    };
}
export interface ListDealsParams {
    stageId?: Query<number>;
    personId?: Query<number>;
    limit?: Query<number>;
    offset?: Query<number>;
}
export interface ListDealsResponse {
    deals: Deal[];
    total: number;
}
export declare const listDeals: (params: ListDealsParams) => Promise<ListDealsResponse>;
