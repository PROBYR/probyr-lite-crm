import { api } from "encore.dev/api";
import { crmDB } from "./db";

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

// Creates a new task.
export const createTask = api<CreateTaskRequest, Task>(
  { expose: true, method: "POST", path: "/tasks" },
  async (req) => {
    const taskRow = await crmDB.queryRow<{ id: number }>`
      INSERT INTO tasks (company_id, assigned_to, person_id, deal_id, title, description, due_date, created_at, updated_at)
      VALUES (${req.companyId}, ${req.assignedTo || null}, ${req.personId || null}, ${req.dealId || null}, ${req.title}, ${req.description || null}, ${req.dueDate || null}, NOW(), NOW())
      RETURNING id
    `;

    if (!taskRow) {
      throw new Error("Failed to create task");
    }

    // Fetch the created task with full details
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
      WHERE t.id = $1
    `;

    const row = await crmDB.rawQueryRow<{
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
    }>(query, taskRow.id);

    if (!row) {
      throw new Error("Failed to fetch created task");
    }

    return {
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
    };
  }
);
