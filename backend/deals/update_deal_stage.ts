import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface UpdateDealStageParams {
  id: number;
}

export interface UpdateDealStageRequest {
  stageId: number;
  lossReason?: string;
}

export interface Deal {
  id: number;
  companyId: number;
  personId?: number;
  stageId: number;
  title: string;
  value?: number;
  expectedCloseDate?: Date;
  probability: number;
  lossReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  person?: {
    id: number;
    firstName: string;
    lastName?: string;
    email?: string;
  };
  stage: {
    id: number;
    name: string;
    position: number;
    isWon: boolean;
    isLost: boolean;
  };
}

// Updates a deal's stage and optionally sets loss reason.
export const updateDealStage = api<UpdateDealStageParams & UpdateDealStageRequest, Deal>(
  { expose: true, method: "PUT", path: "/deals/:id/stage" },
  async (req) => {
    try {
      // Check if deal exists
      const existingDeal = await crmDB.queryRow<{ id: number }>`
        SELECT id FROM deals WHERE id = ${req.id}
      `;

      if (!existingDeal) {
        throw APIError.notFound("deal not found");
      }

      // Update the deal
      await crmDB.exec`
        UPDATE deals 
        SET stage_id = ${req.stageId}, 
            loss_reason = ${req.lossReason || null},
            updated_at = NOW()
        WHERE id = ${req.id}
      `;

      // Fetch updated deal with safe casting
      const query = `
        SELECT 
          d.id, 
          d.company_id, 
          d.person_id, 
          d.stage_id, 
          d.title, 
          COALESCE(d.value::double precision, 0)::double precision as value,
          d.expected_close_date, 
          d.probability, 
          d.loss_reason, 
          d.notes, 
          d.created_at, 
          d.updated_at,
          p.first_name as person_first_name,
          p.last_name as person_last_name,
          p.email as person_email,
          ds.name as stage_name,
          ds.position as stage_position,
          ds.is_won as stage_is_won,
          ds.is_lost as stage_is_lost
        FROM deals d
        LEFT JOIN people p ON d.person_id = p.id
        JOIN deal_stages ds ON d.stage_id = ds.id
        WHERE d.id = $1
      `;

      const row = await crmDB.rawQueryRow<{
        id: number;
        company_id: number;
        person_id: number | null;
        stage_id: number;
        title: string;
        value: number;
        expected_close_date: Date | null;
        probability: number;
        loss_reason: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
        person_first_name: string | null;
        person_last_name: string | null;
        person_email: string | null;
        stage_name: string;
        stage_position: number;
        stage_is_won: boolean;
        stage_is_lost: boolean;
      }>(query, req.id);

      if (!row) {
        throw APIError.notFound("deal not found");
      }

      // Log any value casting issues for debugging
      if (row.value === null || row.value === undefined) {
        console.warn(`Updated deal ${row.id} has null/undefined value, coercing to 0`);
      }

      return {
        id: row.id,
        companyId: row.company_id,
        personId: row.person_id || undefined,
        stageId: row.stage_id,
        title: row.title || '',
        value: typeof row.value === 'number' ? row.value : 0,
        expectedCloseDate: row.expected_close_date || undefined,
        probability: row.probability || 0,
        lossReason: row.loss_reason || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        person: row.person_id ? {
          id: row.person_id,
          firstName: row.person_first_name || '',
          lastName: row.person_last_name || undefined,
          email: row.person_email || undefined,
        } : undefined,
        stage: {
          id: row.stage_id,
          name: row.stage_name || '',
          position: row.stage_position || 0,
          isWon: row.stage_is_won || false,
          isLost: row.stage_is_lost || false,
        },
      };
    } catch (error) {
      console.error('Error in updateDealStage:', error);
      throw error;
    }
  }
);
