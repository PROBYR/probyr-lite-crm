import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Retrieves tasks with optional filtering.
export const listTasks = api({ expose: true, method: "GET", path: "/tasks" }, async (params) => {
    const assignedTo = params.assignedTo;
    const isCompleted = params.isCompleted;
    const dueBefore = params.dueBefore;
    const dueAfter = params.dueAfter;
    const personId = params.personId;
    const dealId = params.dealId;
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    try {
        // Build WHERE conditions
        let whereConditions = [];
        const queryParams = [];
        let paramIndex = 1;
        if (assignedTo !== undefined) {
            whereConditions.push(`t.assigned_to = $${paramIndex}`);
            queryParams.push(assignedTo);
            paramIndex++;
        }
        if (isCompleted !== undefined) {
            whereConditions.push(`t.is_completed = $${paramIndex}`);
            queryParams.push(isCompleted);
            paramIndex++;
        }
        if (dueBefore) {
            whereConditions.push(`t.due_date <= $${paramIndex}`);
            queryParams.push(new Date(dueBefore));
            paramIndex++;
        }
        if (dueAfter) {
            whereConditions.push(`t.due_date >= $${paramIndex}`);
            queryParams.push(new Date(dueAfter));
            paramIndex++;
        }
        if (personId !== undefined) {
            whereConditions.push(`t.person_id = $${paramIndex}`);
            queryParams.push(personId);
            paramIndex++;
        }
        if (dealId !== undefined) {
            whereConditions.push(`t.deal_id = $${paramIndex}`);
            queryParams.push(dealId);
            paramIndex++;
        }
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        // Add limit and offset parameters
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
        const rows = await crmDB.rawQueryAll(query, ...queryParams);
        // Count total with same WHERE conditions
        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const countQuery = `
        SELECT COUNT(*) as total
        FROM tasks t
        ${whereClause}
      `;
        const countResult = await crmDB.rawQueryRow(countQuery, ...countParams);
        const total = Number(countResult?.total || 0);
        const tasks = rows.map(row => ({
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
                firstName: row.assignee_first_name,
                lastName: row.assignee_last_name || undefined,
                email: row.assignee_email,
            } : undefined,
            person: row.person_id ? {
                id: row.person_id,
                firstName: row.person_first_name,
                lastName: row.person_last_name || undefined,
            } : undefined,
            deal: row.deal_id ? {
                id: row.deal_id,
                title: row.deal_title,
            } : undefined,
        }));
        return { tasks, total };
    }
    catch (error) {
        console.error('Error in listTasks:', error);
        throw error;
    }
});
//# sourceMappingURL=list_tasks.js.map