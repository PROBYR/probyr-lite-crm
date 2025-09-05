import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface CreateDealRequest {
  companyId: number;
  personId?: number;
  stageId: number;
  title: string;
  value?: number;
  expectedCloseDate?: Date;
  probability?: number;
  notes?: string;
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

// Creates a new deal.
export const createDeal = api<CreateDealRequest, Deal>(
  { expose: true, method: "POST", path: "/deals" },
  async (req) => {
    const probability = req.probability || 50;
    
    const dealRow = await crmDB.queryRow<{ id: number }>`
      INSERT INTO deals (company_id, person_id, stage_id, title, value, expected_close_date, probability, notes, created_at, updated_at)
      VALUES (${req.companyId}, ${req.personId || null}, ${req.stageId}, ${req.title}, ${req.value || null}, ${req.expectedCloseDate || null}, ${probability}, ${req.notes || null}, NOW(), NOW())
      RETURNING id
    `;

    if (!dealRow) {
      throw new Error("Failed to create deal");
    }

    // Fetch the created deal with full details
    const query = `
      SELECT 
        d.id, d.company_id, d.person_id, d.stage_id, d.title, d.value, d.expected_close_date, d.probability, d.loss_reason, d.notes, d.created_at, d.updated_at,
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
      value: number | null;
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
    }>(query, dealRow.id);

    if (!row) {
      throw new Error("Failed to fetch created deal");
    }

    return {
      id: row.id,
      companyId: row.company_id,
      personId: row.person_id || undefined,
      stageId: row.stage_id,
      title: row.title,
      value: row.value || undefined,
      expectedCloseDate: row.expected_close_date || undefined,
      probability: row.probability,
      lossReason: row.loss_reason || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      person: row.person_id ? {
        id: row.person_id,
        firstName: row.person_first_name!,
        lastName: row.person_last_name || undefined,
        email: row.person_email || undefined,
      } : undefined,
      stage: {
        id: row.stage_id,
        name: row.stage_name,
        position: row.stage_position,
        isWon: row.stage_is_won,
        isLost: row.stage_is_lost,
      },
    };
  }
);
