export interface CreateTaskRequest {
    companyId: number;
    assignedTo?: number;
    personId?: number;
    dealId?: number;
    title: string;
    description?: string;
    dueDate?: Date;
}
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
export declare const createTask: (params: CreateTaskRequest) => Promise<Task>;
