import { api, APIError, Header } from "encore.dev/api";
import { crmDB } from "./db";
import { api_auth } from "~encore/clients";

export interface CreateLeadRequest {
  contact: {
    fullName: string;
    email: string;
    title?: string;
    companyName: string;
    companyWebsite?: string;
  };
  deal: {
    dealName: string;
    value?: number;
    pipelineName: string;
    stageName: string;
  };
  note: {
    content: string;
  };
}

export interface CreateLeadParams {
  authorization: Header<"Authorization">;
}

export interface CreateLeadResponse {
  success: boolean;
  contactId: number;
  companyId: number;
  dealId: number;
  message: string;
}

// Creates a lead from third-party applications with proper permission validation.
export const createLead = api<CreateLeadParams & CreateLeadRequest, CreateLeadResponse>(
  { expose: true, method: "POST", path: "/api/v1/leads" },
  async (req) => {
    try {
      // Validate API key and check permissions
      if (!req.authorization || !req.authorization.startsWith('Bearer ')) {
        throw APIError.unauthenticated("API key required");
      }

      const apiKey = req.authorization.replace('Bearer ', '');
      
      const validation = await api_auth.validateApiKeyWithPermissions({
        key: apiKey,
      });

      if (!validation.isValid) {
        throw APIError.unauthenticated("Invalid API key");
      }

      if (!validation.permissions?.includes('leads:create')) {
        throw APIError.permissionDenied("API key does not have leads:create permission");
      }

      const companyId = validation.companyId!;

      const tx = await crmDB.begin();

      try {
        // Split full name into first and last name
        const nameParts = req.contact.fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Check for existing company by name or website
        let existingCompany = await tx.queryRow<{ id: number }>`
          SELECT id FROM companies 
          WHERE name = ${req.contact.companyName}
          ${req.contact.companyWebsite ? `OR website = ${req.contact.companyWebsite}` : ''}
          LIMIT 1
        `;

        let targetCompanyId: number;
        
        if (existingCompany) {
          targetCompanyId = existingCompany.id;
        } else {
          // Create new company
          const newCompany = await tx.queryRow<{ id: number }>`
            INSERT INTO companies (name, website, created_at, updated_at)
            VALUES (${req.contact.companyName}, ${req.contact.companyWebsite || null}, NOW(), NOW())
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
          WHERE email = ${req.contact.email} AND company_id = ${targetCompanyId}
          LIMIT 1
        `;

        let contactId: number;

        if (existingContact) {
          contactId = existingContact.id;
          
          // Update existing contact with new information
          await tx.exec`
            UPDATE people 
            SET 
              first_name = ${firstName},
              last_name = ${lastName || null},
              job_title = ${req.contact.title || null},
              company_id = ${targetCompanyId},
              updated_at = NOW()
            WHERE id = ${contactId}
          `;
        } else {
          // Create new contact
          const newContact = await tx.queryRow<{ id: number }>`
            INSERT INTO people (
              company_id, first_name, last_name, email, job_title, 
              status, created_at, updated_at
            )
            VALUES (
              ${targetCompanyId}, ${firstName}, ${lastName || null}, 
              ${req.contact.email}, ${req.contact.title || null},
              'New Lead', NOW(), NOW()
            )
            RETURNING id
          `;
          
          if (!newContact) {
            throw new Error("Failed to create contact");
          }
          
          contactId = newContact.id;
        }

        // Find the pipeline and stage
        const pipeline = await tx.queryRow<{ id: number }>`
          SELECT id FROM pipelines 
          WHERE company_id = ${companyId} AND name = ${req.deal.pipelineName}
          LIMIT 1
        `;

        if (!pipeline) {
          throw APIError.invalidArgument(`Pipeline '${req.deal.pipelineName}' not found`);
        }

        const stage = await tx.queryRow<{ id: number }>`
          SELECT id FROM deal_stages 
          WHERE pipeline_id = ${pipeline.id} AND name = ${req.deal.stageName}
          LIMIT 1
        `;

        if (!stage) {
          throw APIError.invalidArgument(`Stage '${req.deal.stageName}' not found in pipeline '${req.deal.pipelineName}'`);
        }

        // Create new deal
        const newDeal = await tx.queryRow<{ id: number }>`
          INSERT INTO deals (
            company_id, person_id, stage_id, title, value, 
            probability, created_at, updated_at
          )
          VALUES (
            ${companyId}, ${contactId}, ${stage.id}, ${req.deal.dealName}, 
            ${req.deal.value || 0}, 50, NOW(), NOW()
          )
          RETURNING id
        `;

        if (!newDeal) {
          throw new Error("Failed to create deal");
        }

        // Add note to activity timeline
        await tx.exec`
          INSERT INTO activities (
            company_id, person_id, deal_id, activity_type, title, description, 
            metadata, created_at
          )
          VALUES (
            ${companyId}, ${contactId}, ${newDeal.id}, 'api_import', 
            'Lead imported via API', ${req.note.content},
            ${JSON.stringify({ 
              sourceApplication: 'Third Party API',
              apiKeyName: validation.keyName 
            })},
            NOW()
          )
        `;

        await tx.commit();

        return {
          success: true,
          contactId: contactId,
          companyId: targetCompanyId,
          dealId: newDeal.id,
          message: "Lead created successfully.",
        };

      } catch (error) {
        await tx.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error in createLead:', error);
      throw error;
    }
  }
);
