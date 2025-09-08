import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface ValidateApiKeyWithPermissionsRequest {
  key: string;
}

export interface ValidateApiKeyWithPermissionsResponse {
  isValid: boolean;
  companyId?: number;
  keyName?: string;
  permissions?: string[];
}

// Validates an API key and returns company information and permissions if valid.
export const validateApiKeyWithPermissions = api<ValidateApiKeyWithPermissionsRequest, ValidateApiKeyWithPermissionsResponse>(
  { expose: false, method: "POST", path: "/internal/validate-api-key-permissions" },
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
        permissions: string;
        is_active: boolean;
      }>`
        SELECT company_id, name, permissions, is_active
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
        permissions: JSON.parse(apiKeyRow.permissions || '[]'),
      };
    } catch (error) {
      console.error('Error in validateApiKeyWithPermissions:', error);
      return { isValid: false };
    }
  }
);
