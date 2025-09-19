import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface UpdateEmailSignatureParams {
  userId: number;
}

export interface UpdateEmailSignatureRequest {
  signature: string;
}

// Updates a user's email signature.
export const updateEmailSignature = api<UpdateEmailSignatureParams & UpdateEmailSignatureRequest, void>(
  { expose: true, method: "PUT", path: "/users/:userId/email-signature" },
  async (req) => {
    try {
      // Check if user exists
      const existingUser = await crmDB.queryRow<{ id: number }>`
        SELECT id FROM users WHERE id = ${req.userId}
      `;

      if (!existingUser) {
        throw APIError.notFound("user not found");
      }

      await crmDB.exec`
        UPDATE users 
        SET email_signature = ${req.signature}, updated_at = NOW()
        WHERE id = ${req.userId}
      `;
    } catch (error) {
      console.error('Error in updateEmailSignature:', error);
      throw error;
    }
  }
);
