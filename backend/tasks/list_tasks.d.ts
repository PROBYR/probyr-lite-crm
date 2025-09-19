import { Query } from "encore.dev/api";
export interface Task {
    id: number;
    companyId: number;
    assignedTo?: number;
    personId?: number;
    dealId?: number;
    title: string;
    description?: string;
    dueDate?: Date;
    isCompleted: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    assignee?: {
        id: number;
        firstName: string;
        lastName?: string;
        email: string;
    };
    person?: {
        id: number;
        firstName: string;
        lastName?: string;
    };
    deal?: {
        id: number;
        title: string;
    };
}
export interface ListTasksParams {
    assignedTo?: Query<number>;
    isCompleted?: Query<boolean>;
    dueBefore?: Query<string>;
    dueAfter?: Query<string>;
    personId?: Query<number>;
    dealId?: Query<number>;
    limit?: Query<number>;
    offset?: Query<number>;
}
export interface ListTasksResponse {
    tasks: Task[];
    total: number;
}
export declare const listTasks: (params: ListTasksParams) => Promise<ListTasksResponse>;
