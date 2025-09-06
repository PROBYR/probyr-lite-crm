import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
import type { Deal } from "../deals/list_deals";

export interface GetPipelineParams {
  id: number;
}

export interface PipelineDetails {
  id: number;
  name: string;
  totalDeals: number;
  totalValue: number;
  averageDealValue: number;
  winRate: number;
  stages: Array<{
    id: number;
    name: string;
    position: number;
    isWon: boolean;
    isLost: boolean;
    deals: Deal[];
    totalValue: number;
  }>;
}

// Retrieves detailed information about a single pipeline, including stages and deals.
export const get = api<GetPipelineParams, PipelineDetails>(
  { expose: true, method: "GET", path: "/pipelines/:id" },
  async ({ id }) => {
    const pipeline = await crmDB.queryRow<{ id: number; name: string }>`
      SELECT id, name FROM pipelines WHERE id = ${id}
    `;
    if (!pipeline) {
      throw APIError.notFound("pipeline not found");
    }

    const stages = await crmDB.queryAll<{
      id: number;
      name: string;
      position: number;
      is_won: boolean;
      is_lost: boolean;
    }>`
      SELECT id, name, position, is_won, is_lost
      FROM deal_stages
      WHERE pipeline_id = ${id}
      ORDER BY position
    `;

    const stageIds = stages.map(s => s.id);
    let deals: Deal[] = [];
    if (stageIds.length > 0) {
      deals = await crmDB.queryAll<Deal>`
        SELECT 
          d.id, d.company_id as "companyId", d.person_id as "personId", d.stage_id as "stageId", d.title, d.value,
          d.expected_close_date as "expectedCloseDate", d.probability, d.loss_reason as "lossReason", d.notes,
          d.created_at as "createdAt", d.updated_at as "updatedAt",
          json_build_object('id', p.id, 'firstName', p.first_name, 'lastName', p.last_name) as person,
          json_build_object('id', ds.id, 'name', ds.name, 'position', ds.position, 'isWon', ds.is_won, 'isLost', ds.is_lost) as stage
        FROM deals d
        LEFT JOIN people p ON d.person_id = p.id
        JOIN deal_stages ds ON d.stage_id = ds.id
        WHERE d.stage_id = ANY(${stageIds})
      `;
    }

    let totalValue = 0;
    let wonDeals = 0;
    let closedDeals = 0;

    const stagesWithDeals = stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stageId === stage.id);
      const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      totalValue += stageValue;
      if (stage.is_won) wonDeals += stageDeals.length;
      if (stage.is_won || stage.is_lost) closedDeals += stageDeals.length;
      return {
        id: stage.id,
        name: stage.name,
        position: stage.position,
        isWon: stage.is_won,
        isLost: stage.is_lost,
        deals: stageDeals,
        totalValue: stageValue,
      };
    });

    return {
      id: pipeline.id,
      name: pipeline.name,
      totalDeals: deals.length,
      totalValue,
      averageDealValue: deals.length > 0 ? totalValue / deals.length : 0,
      winRate: closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0,
      stages: stagesWithDeals,
    };
  }
);
