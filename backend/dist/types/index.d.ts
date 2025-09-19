export interface Person {
    id: number;
    companyId?: number;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    status: string;
    assignedTo?: number;
    lastContactedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    company?: {
        id: number;
        name: string;
    };
    owner?: {
        id: number;
        firstName: string;
        lastName?: string;
        email: string;
    };
    tags: Array<{
        id: number;
        name: string;
        color: string;
    }>;
}
export interface Company {
    id: number;
    name: string;
    website?: string;
    phone?: string;
    address?: string;
    industry?: string;
    bccEmail: string;
    createdAt: Date;
    updatedAt: Date;
    contactCount?: number;
    dealCount?: number;
    totalDealValue?: number;
}
export interface Deal {
    id: number;
    companyId: number;
    personId?: number;
    pipelineId: number;
    stageId: number;
    dealName: string;
    value: number;
    assignedTo?: number;
    expectedCloseDate?: Date;
    actualCloseDate?: Date;
    status: 'open' | 'won' | 'lost';
    createdAt: Date;
    updatedAt: Date;
    company?: {
        id: number;
        name: string;
    };
    person?: {
        id: number;
        firstName: string;
        lastName?: string;
        email?: string;
    };
    pipeline?: {
        id: number;
        name: string;
    };
    stage?: {
        id: number;
        name: string;
        color: string;
        isClosedWon: boolean;
        isClosedLost: boolean;
    };
    owner?: {
        id: number;
        firstName: string;
        lastName?: string;
        email: string;
    };
}
export interface Task {
    id: number;
    companyId: number;
    personId?: number;
    dealId?: number;
    assignedTo: number;
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    person?: {
        id: number;
        firstName: string;
        lastName?: string;
        email?: string;
    };
    deal?: {
        id: number;
        dealName: string;
    };
    assignee?: {
        id: number;
        firstName: string;
        lastName?: string;
        email: string;
    };
}
export interface User {
    id: number;
    companyId: number;
    firstName: string;
    lastName?: string;
    email: string;
    role: 'admin' | 'user';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Pipeline {
    id: number;
    companyId: number;
    name: string;
    description?: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
    stages?: Stage[];
}
export interface Stage {
    id: number;
    pipelineId: number;
    name: string;
    color: string;
    position: number;
    isClosedWon: boolean;
    isClosedLost: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Tag {
    id: number;
    companyId: number;
    name: string;
    color: string;
    createdAt: Date;
}
export interface ApiKey {
    id: number;
    companyId: number;
    name: string;
    description?: string;
    keyPrefix: string;
    permissions: string[];
    isActive: boolean;
    createdAt: Date;
}
export interface ListPeopleParams {
    search?: string;
    tagIds?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
}
export interface ListPeopleResponse {
    people: Person[];
    total: number;
}
export interface ListCompaniesParams {
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
}
export interface ListCompaniesResponse {
    companies: Company[];
    total: number;
}
export interface ListDealsParams {
    pipelineId?: number;
    stageId?: number;
    assignedTo?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
}
export interface ListDealsResponse {
    deals: Deal[];
    total: number;
}
export interface ListTasksParams {
    assignedTo?: number;
    status?: string;
    priority?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
}
export interface ListTasksResponse {
    tasks: Task[];
    total: number;
}
export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}
export interface DbTransaction {
    query: (text: string, params?: any[]) => Promise<any>;
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
    release: () => void;
}
