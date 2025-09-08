import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";

export interface DealTableRow {
  id: number;
  title: string;
  value?: number;
  expectedCloseDate?: Date;
  probability: number;
  createdAt: Date;
  updatedAt: Date;
  person?: {
    id: number;
    firstName: string;
    lastName?: string;
  };
  company?: {
    id: number;
    name: string;
  };
  stage: {
    id: number;
    name: string;
    position: number;
    isWon: boolean;
    isLost: boolean;
  };
  owner?: {
    id: number;
    firstName: string;
    lastName?: string;
  };
}

export interface ListDealsTableParams {
  pipelineId?: Query<number>;
  sortBy?: Query<string>;
  sortOrder?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListDealsTableResponse {
  deals: DealTableRow[];
  total: number;
}

// Retrieves deals in table format for a specific pipeline.
export const listDealsTable = api<ListDealsTableParams, ListDealsTableResponse>(
  { expose: true, method: "GET", path: "/deals/table" },
  async (params) => {
    const pipelineId = params.pipelineId || 1;
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';
    const limit = params.limit || 100;
    const offset = params.offset || 0;

    try {
      // Build sort clause
      let orderClause = 'ORDER BY ';
      switch (sortBy) {
        case 'title':
          orderClause += `d.title ${sortOrder.toUpperCase()}`;
          break;
        case 'value':
          orderClause += `COALESCE(d.value, 0) ${sortOrder.toUpperCase()}`;
          break;
        case 'stage':
          orderClause += `ds.position ${sortOrder.toUpperCase()}`;
          break;
        case 'company':
          orderClause += `c.name ${sortOrder.toUpperCase()} NULLS LAST`;
          break;
        case 'owner':
          orderClause += `u.first_name ${sortOrder.toUpperCase()} NULLS LAST, u.last_name ${sortOrder.toUpperCase()} NULLS LAST`;
          break;
        case 'expected_close':
          orderClause += `d.expected_close_date ${sortOrder.toUpperCase()} NULLS LAST`;
          break;
        default:
          orderClause += `d.created_at ${sortOrder.toUpperCase()}`;
      }

      const query = `
        SELECT 
          d.id, 
          d.title, 
          COALESCE(d.value::double precision, 0)::double precision as value,
          d.expected_close_date, 
          d.probability, 
          d.created_at, 
          d.updated_at,
          p.id as person_id,
          p.first_name as person_first_name,
          p.last_name as person_last_name,
          c.id as company_id,
          c.name as company_name,
          ds.id as stage_id,
          ds.name as stage_name,
          ds.position as stage_position,
          ds.is_won as stage_is_won,
          ds.is_lost as stage_is_lost,
          u.id as owner_id,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name
        FROM deals d
        JOIN deal_stages ds ON d.stage_id = ds.id
        LEFT JOIN people p ON d.person_id = p.id
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users u ON d.assigned_to = u.id
        WHERE ds.pipeline_id = $1
        ${orderClause}
        LIMIT $2 OFFSET $3
      `;

      const rows = await crmDB.rawQueryAll<{
        id: number;
        title: string;
        value: number;
        expected_close_date: Date | null;
        probability: number;
        created_at: Date;
        updated_at: Date;
        person_id: number | null;
        person_first_name: string | null;
        person_last_name: string | null;
        company_id: number | null;
        company_name: string | null;
        stage_id: number;
        stage_name: string;
        stage_position: number;
        stage_is_won: boolean;
        stage_is_lost: boolean;
        owner_id: number | null;
        owner_first_name: string | null;
        owner_last_name: string | null;
      }>(query, pipelineId, limit, offset);

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM deals d
        JOIN deal_stages ds ON d.stage_id = ds.id
        WHERE ds.pipeline_id = $1
      `;
      
      const countResult = await crmDB.rawQueryRow<{ total: string }>(countQuery, pipelineId);
      const total = Number(countResult?.total || 0);

      const deals: DealTableRow[] = rows.map(row => ({
        id: row.id,
        title: row.title || '',
        value: typeof row.value === 'number' ? row.value : undefined,
        expectedCloseDate: row.expected_close_date || undefined,
        probability: row.probability || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        person: row.person_id ? {
          id: row.person_id,
          firstName: row.person_first_name || '',
          lastName: row.person_last_name || undefined,
        } : undefined,
        company: row.company_id ? {
          id: row.company_id,
          name: row.company_name || '',
        } : undefined,
        stage: {
          id: row.stage_id,
          name: row.stage_name || '',
          position: row.stage_position || 0,
          isWon: row.stage_is_won || false,
          isLost: row.stage_is_lost || false,
        },
        owner: row.owner_id ? {
          id: row.owner_id,
          firstName: row.owner_first_name || '',
          lastName: row.owner_last_name || undefined,
        } : undefined,
      }));

      return { deals, total };
    } catch (error) {
      console.error('Error in listDealsTable:', error);
      return { deals: [], total: 0 };
    }
  }
);
