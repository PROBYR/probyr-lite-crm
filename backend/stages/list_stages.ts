import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";

export interface DealStage {
  id: number;
  companyId: number;
  name: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
  createdAt: Date;
}

export interface ListStagesParams {
  companyId?: Query<number>;
}

export interface ListStagesResponse {
  stages: DealStage[];
}

// Retrieves deal stages for a company, ordered by position.
export const listStages = api<ListStagesParams, ListStagesResponse>(
  { expose: true, method: "GET", path: "/stages" },
  async (params) => {
    const companyId = params.companyId || 1; // Default to demo company

    const rows = await crmDB.queryAll<{
      id: number;
      company_id: number;
      name: string;
      position: number;
      is_won: boolean;
      is_lost: boolean;
      created_at: Date;
    }>`
      SELECT * FROM deal_stages 
      WHERE company_id = ${companyId}
      ORDER BY position
    `;

    const stages: DealStage[] = rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      position: row.position,
      isWon: row.is_won,
      isLost: row.is_lost,
      createdAt: row.created_at,
    }));

    return { stages };
  }
);
