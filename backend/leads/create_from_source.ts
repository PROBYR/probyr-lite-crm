import { api, APIError, Header } from "encore.dev/api";
import { crmDB } from "./db";

export interface CreateLeadFromSourceRequest {
  sourceApplication: string;
  sourceIdentifier?: string;
  prospect: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    title?: string;
  };
  company: {
    name: string;
    website?: string;
    industry?: string;
  };
  deal: {
    name: string;
    value?: number;
    pipelineStage: string;
  };
  initialNote: string;
}

export interface CreateLeadFromSourceParams {
  authorization: Header<"Authorization">;
}

export interface CreateLeadFromSourceResponse {
  message: string;
  contactId: number;
  companyId: number;
  dealId: number;
}

// Creates a lead from an external source like ProByr Outreach Pro.
export const createFromSource = api<CreateLeadFromSourceParams & CreateLeadFromSourceRequest, CreateLeadFromSourceResponse>(
  { expose: true, method: "POST", path: "/api/v1/leads/create-from-source" },
  async (req) => {
    try {
      // Validate API key
      if (!req.authorization || !req.authorization.startsWith('Bearer ')) {
        throw APIError.unauthenticated("API key required");
      }

      const apiKey = req.authorization.replace('Bearer ', '');
      
      // In a real implementation, validate the API key properly
      if (!apiKey.startsWith('pbr_')) {
        throw APIError.unauthenticated("Invalid API key format");
      }

      // For demo purposes, assume API key is valid and belongs to company 1
      const companyId = 1;

      const tx = await crmDB.begin();

      try {
        // Check for existing company by website or name
        let existingCompany = await tx.queryRow<{ id: number }>`
          SELECT id FROM companies 
          WHERE company_id = ${companyId} 
          AND (website = ${req.company.website || null} OR name = ${req.company.name})
          LIMIT 1
        `;

        let targetCompanyId: number;
        
        if (existingCompany) {
          targetCompanyId = existingCompany.id;
        } else {
          // Create new company
          const newCompany = await tx.queryRow<{ id: number }>`
            INSERT INTO companies (name, website, created_at, updated_at)
            VALUES (${req.company.name}, ${req.company.website || null}, NOW(), NOW())
            RETURNING id
          `;
          
          if (!newCompany) {
            throw new Error("Failed to create company");
          }
          
          targetCompanyId = newCompany.id;
        }

        // Check for existing contact by email
        let existingContact = await tx.queryRow<{ id: number }>`
          SELECT id FROM people 
          WHERE email = ${req.prospect.email} AND company_id = ${companyId}
          LIMIT 1
        `;

        let contactId: number;

        if (existingContact) {
          contactId = existingContact.id;
          
          // Update existing contact with new information
          await tx.exec`
            UPDATE people 
            SET 
              first_name = ${req.prospect.firstName},
              last_name = ${req.prospect.lastName},
              phone = ${req.prospect.phone || null},
              job_title = ${req.prospect.title || null},
              company_id = ${targetCompanyId},
              updated_at = NOW()
            WHERE id = ${contactId}
          `;
        } else {
          // Create new contact
          const newContact = await tx.queryRow<{ id: number }>`
            INSERT INTO people (
              company_id, first_name, last_name, email, phone, job_title, 
              status, created_at, updated_at
            )
            VALUES (
              ${targetCompanyId}, ${req.prospect.firstName}, ${req.prospect.lastName}, 
              ${req.prospect.email}, ${req.prospect.phone || null}, ${req.prospect.title || null},
              'New Lead', NOW(), NOW()
            )
            RETURNING id
          `;
          
          if (!newContact) {
            throw new Error("Failed to create contact");
          }
          
          contactId = newContact.id;
        }

        // Find the pipeline stage
        const stage = await tx.queryRow<{ id: number }>`
          SELECT id FROM deal_stages 
          WHERE company_id = ${companyId} AND name = ${req.deal.pipelineStage}
          LIMIT 1
        `;

        if (!stage) {
          throw APIError.invalidArgument(`Pipeline stage '${req.deal.pipelineStage}' not found`);
        }

        // Create new deal
        const newDeal = await tx.queryRow<{ id: number }>`
          INSERT INTO deals (
            company_id, person_id, stage_id, title, value, 
            probability, created_at, updated_at
          )
          VALUES (
            ${companyId}, ${contactId}, ${stage.id}, ${req.deal.name}, 
            ${req.deal.value || 0}, 50, NOW(), NOW()
          )
          RETURNING id
        `;

        if (!newDeal) {
          throw new Error("Failed to create deal");
        }

        // Add initial note to activity timeline
        await tx.exec`
          INSERT INTO activities (
            company_id, person_id, deal_id, activity_type, title, description, 
            metadata, created_at
          )
          VALUES (
            ${companyId}, ${contactId}, ${newDeal.id}, 'api_import', 
            'Lead imported from ${req.sourceApplication}', ${req.initialNote},
            ${JSON.stringify({ 
              sourceApplication: req.sourceApplication, 
              sourceIdentifier: req.sourceIdentifier 
            })},
            NOW()
          )
        `;

        await tx.commit();

        return {
          message: "Lead processed successfully.",
          contactId: contactId,
          companyId: targetCompanyId,
          dealId: newDeal.id,
        };

      } catch (error) {
        await tx.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error in createFromSource:', error);
      throw error;
    }
  }
);
