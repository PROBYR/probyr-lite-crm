import { Query } from "encore.dev/api";
export interface DealTableRow {
    id: number;
    title: string;
    value?: number;
    expectedCloseDate?: Date;
    probability: number;
    createdAt: Date;
    updatedAt: Date;
    person?: {
        id: number;
        firstName: string;
        lastName?: string;
    };
    company?: {
        id: number;
        name: string;
    };
    stage: {
        id: number;
        name: string;
        position: number;
        isWon: boolean;
        isLost: boolean;
    };
    owner?: {
        id: number;
        firstName: string;
        lastName?: string;
    };
}
export interface ListDealsTableParams {
    pipelineId?: Query<number>;
    sortBy?: Query<string>;
    sortOrder?: Query<string>;
    limit?: Query<number>;
    offset?: Query<number>;
}
export interface ListDealsTableResponse {
    deals: DealTableRow[];
    total: number;
}
export declare const listDealsTable: (params: ListDealsTableParams) => Promise<ListDealsTableResponse>;
