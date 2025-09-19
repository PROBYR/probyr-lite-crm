import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface CreateTagRequest {
  companyId: number;
  name: string;
  color?: string;
}

export interface Tag {
  id: number;
  companyId: number;
  name: string;
  color: string;
  createdAt: Date;
}

// Creates a new tag.
export const createTag = api<CreateTagRequest, Tag>(
  { expose: true, method: "POST", path: "/tags" },
  async (req) => {
    const color = req.color || '#3B82F6';
    
    const tagRow = await crmDB.queryRow<{
      id: number;
      company_id: number;
      name: string;
      color: string;
      created_at: Date;
    }>`
      INSERT INTO tags (company_id, name, color, created_at)
      VALUES (${req.companyId}, ${req.name}, ${color}, NOW())
      RETURNING *
    `;

    if (!tagRow) {
      throw new Error("Failed to create tag");
    }

    return {
      id: tagRow.id,
      companyId: tagRow.company_id,
      name: tagRow.name,
      color: tagRow.color,
      createdAt: tagRow.created_at,
    };
  }
);
