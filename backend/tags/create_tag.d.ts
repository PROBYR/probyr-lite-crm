export interface CreateTagRequest {
    companyId: number;
    name: string;
    color?: string;
}
export interface Tag {
    id: number;
    companyId: number;
    name: string;
    color: string;
    createdAt: Date;
}
export declare const createTag: (params: CreateTagRequest) => Promise<Tag>;
