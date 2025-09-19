import type { Deal } from "../deals/list_deals";
export interface GetPipelineParams {
    id: number;
}
export interface PipelineDetails {
    id: number;
    name: string;
    totalDeals: number;
    totalValue: number;
    averageDealValue: number;
    winRate: number;
    stages: Array<{
        id: number;
        name: string;
        position: number;
        isWon: boolean;
        isLost: boolean;
        deals: Deal[];
        totalValue: number;
    }>;
}
export declare const get: (params: GetPipelineParams) => Promise<PipelineDetails>;
