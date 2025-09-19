export interface Pipeline {
    id: number;
    name: string;
    companyId: number;
    createdAt: Date;
    updatedAt: Date;
    stageCount: number;
    dealCount: number;
}
export interface ListPipelinesResponse {
    pipelines: Pipeline[];
}
export declare const list: () => Promise<ListPipelinesResponse>;
