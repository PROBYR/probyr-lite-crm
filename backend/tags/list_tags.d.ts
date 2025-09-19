import { Query } from "encore.dev/api";
export interface Tag {
    id: number;
    companyId: number;
    name: string;
    color: string;
    createdAt: Date;
}
export interface ListTagsParams {
    companyId?: Query<number>;
}
export interface ListTagsResponse {
    tags: Tag[];
}
export declare const listTags: (params: ListTagsParams) => Promise<ListTagsResponse>;
