import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface TestDealRequest {
  value: number;
}

export interface TestDealResponse {
  success: boolean;
  dealId: number;
  retrievedValue: number;
}

// Test endpoint to verify deal value casting works correctly
export const testDealValueCasting = api<TestDealRequest, TestDealResponse>(
  { expose: true, method: "POST", path: "/deals/test-value-casting" },
  async (req) => {
    try {
      // Insert a test deal with the specified value
      const dealRow = await crmDB.queryRow<{ id: number }>`
        INSERT INTO deals (company_id, stage_id, title, value, created_at, updated_at)
        VALUES (1, 1, 'Test Deal Value Casting', ${req.value}, NOW(), NOW())
        RETURNING id
      `;

      if (!dealRow) {
        throw new Error("Failed to create test deal");
      }

      // Retrieve the deal using the same casting logic as listDeals
      const query = `
        SELECT 
          id,
          COALESCE(value::double precision, 0)::double precision as value
        FROM deals 
        WHERE id = $1
      `;

      const row = await crmDB.rawQueryRow<{
        id: number;
        value: number;
      }>(query, dealRow.id);

      if (!row) {
        throw new Error("Failed to retrieve test deal");
      }

      // Clean up test deal
      await crmDB.exec`DELETE FROM deals WHERE id = ${dealRow.id}`;

      return {
        success: true,
        dealId: dealRow.id,
        retrievedValue: row.value,
      };
    } catch (error) {
      console.error('Error in testDealValueCasting:', error);
      throw error;
    }
  }
);
