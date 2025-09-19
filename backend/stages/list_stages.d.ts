import { Query } from "encore.dev/api";
export interface DealStage {
    id: number;
    companyId: number;
    pipelineId: number;
    name: string;
    position: number;
    isWon: boolean;
    isLost: boolean;
    createdAt: Date;
}
export interface ListStagesParams {
    companyId?: Query<number>;
    pipelineId?: Query<number>;
}
export interface ListStagesResponse {
    stages: DealStage[];
}
export declare const listStages: (params: ListStagesParams) => Promise<ListStagesResponse>;
