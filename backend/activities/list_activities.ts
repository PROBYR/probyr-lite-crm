import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";

export interface Activity {
  id: number;
  companyId: number;
  userId?: number;
  personId?: number;
  dealId?: number;
  activityType: string;
  title: string;
  description?: string;
  emailSubject?: string;
  emailBody?: string;
  metadata?: any;
  createdAt: Date;
  user?: {
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

export interface ListActivitiesParams {
  personId?: Query<number>;
  dealId?: Query<number>;
  activityType?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListActivitiesResponse {
  activities: Activity[];
  total: number;
}

// Retrieves activities with optional filtering.
export const listActivities = api<ListActivitiesParams, ListActivitiesResponse>(
  { expose: true, method: "GET", path: "/activities" },
  async (params) => {
    const personId = params.personId;
    const dealId = params.dealId;
    const activityType = params.activityType;
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    try {
      // Build the WHERE clause with simplified logic
      let whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (personId !== undefined) {
        whereConditions.push(`a.person_id = $${paramIndex}`);
        queryParams.push(personId);
        paramIndex++;
      }

      if (dealId !== undefined) {
        whereConditions.push(`a.deal_id = $${paramIndex}`);
        queryParams.push(dealId);
        paramIndex++;
      }

      if (activityType) {
        whereConditions.push(`a.activity_type = $${paramIndex}`);
        queryParams.push(activityType);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Add limit and offset parameters
      queryParams.push(limit, offset);
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const query = `
        SELECT 
          a.*,
          u.id as user_id,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          u.email as user_email,
          p.id as person_id,
          p.first_name as person_first_name,
          p.last_name as person_last_name,
          d.id as deal_id,
          d.title as deal_title
        FROM activities a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN people p ON a.person_id = p.id
        LEFT JOIN deals d ON a.deal_id = d.id
        ${whereClause}
        ORDER BY a.created_at DESC
        ${limitClause}
      `;

      const rows = await crmDB.rawQueryAll<{
        id: number;
        company_id: number;
        user_id: number | null;
        person_id: number | null;
        deal_id: number | null;
        activity_type: string;
        title: string;
        description: string | null;
        email_subject: string | null;
        email_body: string | null;
        metadata: any;
        created_at: Date;
        user_first_name: string | null;
        user_last_name: string | null;
        user_email: string | null;
        person_first_name: string | null;
        person_last_name: string | null;
        deal_title: string | null;
      }>(query, ...queryParams);

      // Count total with same WHERE conditions
      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const countQuery = `
        SELECT COUNT(*) as total
        FROM activities a
        ${whereClause}
      `;
      
      const countResult = await crmDB.rawQueryRow<{ total: number }>(countQuery, ...countParams);
      const total = Number(countResult?.total || 0);

      const activities: Activity[] = rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id || undefined,
        personId: row.person_id || undefined,
        dealId: row.deal_id || undefined,
        activityType: row.activity_type,
        title: row.title,
        description: row.description || undefined,
        emailSubject: row.email_subject || undefined,
        emailBody: row.email_body || undefined,
        metadata: row.metadata || undefined,
        createdAt: row.created_at,
        user: row.user_id ? {
          id: row.user_id,
          firstName: row.user_first_name!,
          lastName: row.user_last_name || undefined,
          email: row.user_email!,
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

      return { activities, total };
    } catch (error) {
      console.error('Error in listActivities:', error);
      throw error;
    }
  }
);
