import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface AssignOwnerRequest {
  personIds: number[];
  userId?: number;
}

export interface AssignOwnerResponse {
  updatedCount: number;
}

// Assigns an owner to multiple contacts.
export const assignOwner = api<AssignOwnerRequest, AssignOwnerResponse>(
  { expose: true, method: "POST", path: "/people/assign-owner" },
  async (req) => {
    try {
      if (req.personIds.length === 0) {
        return { updatedCount: 0 };
      }

      // Update all selected contacts with the new owner
      await crmDB.exec`
        UPDATE people 
        SET assigned_to = ${req.userId || null}, updated_at = NOW()
        WHERE id = ANY(${req.personIds})
      `;

      return { updatedCount: req.personIds.length };
    } catch (error) {
      console.error('Error in assignOwner:', error);
      throw error;
    }
  }
);
