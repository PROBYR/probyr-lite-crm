export interface CreatePipelineRequest {
    name: string;
    companyId: number;
    stages: Array<{
        name: string;
        position: number;
        isWon: boolean;
        isLost: boolean;
    }>;
}
export interface Pipeline {
    id: number;
    name: string;
    companyId: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const create: (params: CreatePipelineRequest) => Promise<Pipeline>;
