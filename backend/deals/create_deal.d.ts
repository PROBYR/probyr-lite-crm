export interface CreateDealRequest {
    companyId: number;
    personId?: number;
    stageId: number;
    title: string;
    value?: number;
    expectedCloseDate?: Date;
    probability?: number;
    notes?: string;
    assignedTo?: number;
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
    assignedTo?: number;
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
export declare const createDeal: (params: CreateDealRequest) => Promise<Deal>;
