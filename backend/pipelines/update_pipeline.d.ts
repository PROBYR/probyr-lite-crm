export interface UpdatePipelineParams {
    id: number;
}
export interface UpdatePipelineRequest {
    name?: string;
    stages?: Array<{
        id?: number;
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
export declare const updatePipeline: (params: UpdatePipelineParams & UpdatePipelineRequest) => Promise<Pipeline>;
