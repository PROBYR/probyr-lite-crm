import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";

export interface DealStage {
  id: number;
  companyId: number;
  pipelineId: number;
  name: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
  createdAt: Date;
}

export interface ListStagesParams {
  companyId?: Query<number>;
  pipelineId?: Query<number>;
}

export interface ListStagesResponse {
  stages: DealStage[];
}

// Retrieves deal stages for a company, ordered by position.
export const listStages = api<ListStagesParams, ListStagesResponse>(
  { expose: true, method: "GET", path: "/stages" },
  async (params) => {
    try {
      const companyId = params.companyId || 1; // Default to demo company
      
      let query = `SELECT * FROM deal_stages WHERE company_id = ${companyId}`;
      if (params.pipelineId) {
        query += ` AND pipeline_id = ${params.pipelineId}`;
      }
      query += ` ORDER BY position`;

      const rows = await crmDB.queryAll<{
        id: number;
        company_id: number;
        pipeline_id: number;
        name: string;
        position: number;
        is_won: boolean;
        is_lost: boolean;
        created_at: Date;
      }>(query);

      const stages: DealStage[] = rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        pipelineId: row.pipeline_id,
        name: row.name || '',
        position: row.position,
        isWon: row.is_won,
        isLost: row.is_lost,
        createdAt: row.created_at,
      }));

      return { stages };
    } catch (error) {
      console.error('Error in listStages:', error);
      return { stages: [] };
    }
  }
);
