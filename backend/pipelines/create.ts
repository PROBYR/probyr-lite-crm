import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface CreatePipelineRequest {
  name: string;
  companyId: number;
}

export interface Pipeline {
  id: number;
  name: string;
  companyId: number;
}

// Creates a new pipeline.
export const create = api<CreatePipelineRequest, Pipeline>(
  { expose: true, method: "POST", path: "/pipelines" },
  async (req) => {
    const pipeline = await crmDB.queryRow<Pipeline>`
      INSERT INTO pipelines (name, company_id)
      VALUES (${req.name}, ${req.companyId})
      RETURNING id, name, company_id as "companyId"
    `;
    if (!pipeline) {
      throw new Error("Failed to create pipeline");
    }
    return pipeline;
  }
);
