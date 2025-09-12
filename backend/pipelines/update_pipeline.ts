import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface UpdatePipelineParams {
  id: number;
}

export interface UpdatePipelineRequest {
  name?: string;
  stages?: Array<{
    id?: number;
    name: string;
    position: number;
    isWon: boolean;
    isLost: boolean;
  }>;
}

export interface Pipeline {
  id: number;
  name: string;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Updates an existing pipeline and its stages.
export const updatePipeline = api<UpdatePipelineParams & UpdatePipelineRequest, Pipeline>(
  { expose: true, method: "PUT", path: "/pipelines/:id" },
  async (req) => {
    const tx = await crmDB.begin();
    
    try {
      // Check if pipeline exists
      const existingPipeline = await tx.queryRow<{ id: number; company_id: number }>`
        SELECT id, company_id FROM pipelines WHERE id = ${req.id}
      `;

      if (!existingPipeline) {
        throw APIError.notFound("pipeline not found");
      }

      // Update pipeline name if provided
      if (req.name !== undefined) {
        await tx.exec`
          UPDATE pipelines 
          SET name = ${req.name}, updated_at = NOW()
          WHERE id = ${req.id}
        `;
      }

      // Update stages if provided
      if (req.stages !== undefined) {
        // Delete existing stages for this pipeline
        await tx.exec`
          DELETE FROM deal_stages WHERE pipeline_id = ${req.id}
        `;

        // Create new stages
        for (const stage of req.stages) {
          await tx.exec`
            INSERT INTO deal_stages (company_id, pipeline_id, name, position, is_won, is_lost, created_at)
            VALUES (${existingPipeline.company_id}, ${req.id}, ${stage.name}, ${stage.position}, ${stage.isWon}, ${stage.isLost}, NOW())
          `;
        }
      }

      await tx.commit();

      // Fetch updated pipeline
      const updatedPipeline = await crmDB.queryRow<{
        id: number;
        name: string;
        company_id: number;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT id, name, company_id, created_at, updated_at
        FROM pipelines WHERE id = ${req.id}
      `;

      if (!updatedPipeline) {
        throw APIError.notFound("pipeline not found");
      }

      return {
        id: updatedPipeline.id,
        name: updatedPipeline.name,
        companyId: updatedPipeline.company_id,
        createdAt: updatedPipeline.created_at,
        updatedAt: updatedPipeline.updated_at,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
