import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface ValidateApiKeyRequest {
  key: string;
}

export interface ValidateApiKeyResponse {
  isValid: boolean;
  companyId?: number;
  keyName?: string;
}

// Validates an API key and returns company information if valid.
export const validateApiKey = api<ValidateApiKeyRequest, ValidateApiKeyResponse>(
  { expose: false, method: "POST", path: "/internal/validate-api-key" },
  async (req) => {
    try {
      if (!req.key || !req.key.startsWith('pbr_')) {
        return { isValid: false };
      }

      // In a real implementation, you would hash the incoming key and compare with stored hash
      // For demo purposes, we'll do a simple prefix match
      const keyPrefix = req.key.substring(0, 12) + '...';
      
      const apiKeyRow = await crmDB.queryRow<{
        company_id: number;
        name: string;
        is_active: boolean;
      }>`
        SELECT company_id, name, is_active
        FROM api_keys 
        WHERE key_prefix = ${keyPrefix} AND is_active = TRUE
      `;

      if (!apiKeyRow) {
        return { isValid: false };
      }

      return {
        isValid: true,
        companyId: apiKeyRow.company_id,
        keyName: apiKeyRow.name,
      };
    } catch (error) {
      console.error('Error in validateApiKey:', error);
      return { isValid: false };
    }
  }
);
