import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";

export interface ApiKey {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface ListApiKeysParams {
  companyId?: Query<number>;
}

export interface ListApiKeysResponse {
  apiKeys: ApiKey[];
}

// Retrieves all API keys with permissions for a company.
export const listApiKeysWithPermissions = api<ListApiKeysParams, ListApiKeysResponse>(
  { expose: true, method: "GET", path: "/api-keys/detailed" },
  async (params) => {
    try {
      const companyId = params.companyId || 1; // Default to demo company

      const rows = await crmDB.queryAll<{
        id: number;
        company_id: number;
        name: string;
        description: string | null;
        key_prefix: string;
        permissions: string;
        is_active: boolean;
        created_at: Date;
      }>`
        SELECT id, company_id, name, description, key_prefix, permissions, is_active, created_at
        FROM api_keys 
        WHERE company_id = ${companyId}
        ORDER BY created_at DESC
      `;

      const apiKeys: ApiKey[] = rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name || '',
        description: row.description || undefined,
        keyPrefix: row.key_prefix || '',
        permissions: JSON.parse(row.permissions || '[]'),
        isActive: row.is_active,
        createdAt: row.created_at,
      }));

      return { apiKeys };
    } catch (error) {
      console.error('Error in listApiKeysWithPermissions:', error);
      return { apiKeys: [] };
    }
  }
);
