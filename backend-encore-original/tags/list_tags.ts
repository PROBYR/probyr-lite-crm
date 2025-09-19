import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { crmDB } from "./db";

export interface Tag {
  id: number;
  companyId: number;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ListTagsParams {
  companyId?: Query<number>;
}

export interface ListTagsResponse {
  tags: Tag[];
}

// Retrieves all tags for a company.
export const listTags = api<ListTagsParams, ListTagsResponse>(
  { expose: true, method: "GET", path: "/tags" },
  async (params) => {
    try {
      const companyId = params.companyId || 1; // Default to demo company

      const rows = await crmDB.queryAll<{
        id: number;
        company_id: number;
        name: string;
        color: string;
        created_at: Date;
      }>`
        SELECT * FROM tags 
        WHERE company_id = ${companyId}
        ORDER BY name
      `;

      const tags: Tag[] = rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name || '',
        color: row.color || '#3B82F6',
        createdAt: row.created_at,
      }));

      return { tags };
    } catch (error) {
      console.error('Error in listTags:', error);
      return { tags: [] };
    }
  }
);
