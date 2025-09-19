export interface UpdateDealStageParams {
    id: number;
}
export interface UpdateDealStageRequest {
    stageId: number;
    lossReason?: string;
}
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
export declare const updateDealStage: (params: UpdateDealStageParams & UpdateDealStageRequest) => Promise<Deal>;
