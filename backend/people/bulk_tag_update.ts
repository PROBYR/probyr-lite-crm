import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface BulkTagUpdateRequest {
  personIds: number[];
  tagIds: number[];
  operation: 'add' | 'remove';
}

export interface BulkTagUpdateResponse {
  updatedCount: number;
}

// Adds or removes tags from multiple contacts.
export const bulkTagUpdate = api<BulkTagUpdateRequest, BulkTagUpdateResponse>(
  { expose: true, method: "POST", path: "/people/bulk-tag-update" },
  async (req) => {
    try {
      if (req.personIds.length === 0 || req.tagIds.length === 0) {
        return { updatedCount: 0 };
      }

      const tx = await crmDB.begin();

      try {
        if (req.operation === 'add') {
          // Add tags to contacts
          for (const personId of req.personIds) {
            for (const tagId of req.tagIds) {
              await tx.exec`
                INSERT INTO contact_tags (person_id, tag_id, created_at)
                VALUES (${personId}, ${tagId}, NOW())
                ON CONFLICT (person_id, tag_id) DO NOTHING
              `;
            }
          }
        } else {
          // Remove tags from contacts
          await tx.exec`
            DELETE FROM contact_tags 
            WHERE person_id = ANY(${req.personIds}) 
            AND tag_id = ANY(${req.tagIds})
          `;
        }

        await tx.commit();
        return { updatedCount: req.personIds.length };
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in bulkTagUpdate:', error);
      throw error;
    }
  }
);
