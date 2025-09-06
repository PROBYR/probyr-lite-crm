import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface Pipeline {
  id: number;
  name: string;
  companyId: number;
}

export interface ListPipelinesResponse {
  pipelines: Pipeline[];
}

// Lists all pipelines for a company.
export const list = api<void, ListPipelinesResponse>(
  { expose: true, method: "GET", path: "/pipelines" },
  async () => {
    const pipelines = await crmDB.queryAll<Pipeline>`
      SELECT id, name, company_id as "companyId"
      FROM pipelines
      WHERE company_id = 1 -- Assuming demo company
      ORDER BY name
    `;
    return { pipelines };
  }
);
