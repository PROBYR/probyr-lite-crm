import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";

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

// Retrieves tasks with optional filtering.
export const listTasks = api<ListTasksParams, ListTasksResponse>(
  { expose: true, method: "GET", path: "/tasks" },
  async (params) => {
    const assignedTo = params.assignedTo;
    const isCompleted = params.isCompleted;
    const dueBefore = params.dueBefore;
    const dueAfter = params.dueAfter;
    const personId = params.personId;
    const dealId = params.dealId;
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (assignedTo !== undefined) {
      whereClause += ` AND t.assigned_to = $${paramIndex}`;
      queryParams.push(assignedTo);
      paramIndex++;
    }

    if (isCompleted !== undefined) {
      whereClause += ` AND t.is_completed = $${paramIndex}`;
      queryParams.push(isCompleted);
      paramIndex++;
    }

    if (dueBefore) {
      whereClause += ` AND t.due_date <= $${paramIndex}`;
      queryParams.push(new Date(dueBefore));
      paramIndex++;
    }

    if (dueAfter) {
      whereClause += ` AND t.due_date >= $${paramIndex}`;
      queryParams.push(new Date(dueAfter));
      paramIndex++;
    }

    if (personId) {
      whereClause += ` AND t.person_id = $${paramIndex}`;
      queryParams.push(personId);
      paramIndex++;
    }

    if (dealId) {
      whereClause += ` AND t.deal_id = $${paramIndex}`;
      queryParams.push(dealId);
      paramIndex++;
    }

    queryParams.push(limit, offset);
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const query = `
      SELECT 
        t.*,
        u.id as assignee_id,
        u.first_name as assignee_first_name,
        u.last_name as assignee_last_name,
        u.email as assignee_email,
        p.id as person_id,
        p.first_name as person_first_name,
        p.last_name as person_last_name,
        d.id as deal_id,
        d.title as deal_title
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN people p ON t.person_id = p.id
      LEFT JOIN deals d ON t.deal_id = d.id
      ${whereClause}
      ORDER BY 
        CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
        t.due_date ASC,
        t.created_at DESC
      ${limitClause}
    `;

    const rows = await crmDB.rawQueryAll<{
      id: number;
      company_id: number;
      assigned_to: number | null;
      person_id: number | null;
      deal_id: number | null;
      title: string;
      description: string | null;
      due_date: Date | null;
      is_completed: boolean;
      completed_at: Date | null;
      created_at: Date;
      updated_at: Date;
      assignee_id: number | null;
      assignee_first_name: string | null;
      assignee_last_name: string | null;
      assignee_email: string | null;
      person_first_name: string | null;
      person_last_name: string | null;
      deal_title: string | null;
    }>(query, ...queryParams);

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tasks t
      ${whereClause.replace(/LIMIT.*/, '')}
    `;
    const countParams = queryParams.slice(0, -2);
    const countResult = await crmDB.rawQueryRow<{ total: number }>(countQuery, ...countParams);
    const total = countResult?.total || 0;

    const tasks: Task[] = rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      assignedTo: row.assigned_to || undefined,
      personId: row.person_id || undefined,
      dealId: row.deal_id || undefined,
      title: row.title,
      description: row.description || undefined,
      dueDate: row.due_date || undefined,
      isCompleted: row.is_completed,
      completedAt: row.completed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assignee: row.assignee_id ? {
        id: row.assignee_id,
        firstName: row.assignee_first_name!,
        lastName: row.assignee_last_name || undefined,
        email: row.assignee_email!,
      } : undefined,
      person: row.person_id ? {
        id: row.person_id,
        firstName: row.person_first_name!,
        lastName: row.person_last_name || undefined,
      } : undefined,
      deal: row.deal_id ? {
        id: row.deal_id,
        title: row.deal_title!,
      } : undefined,
    }));

    return { tasks, total };
  }
);
