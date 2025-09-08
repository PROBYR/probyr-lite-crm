import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface GetEmailSignatureParams {
  userId: number;
}

export interface EmailSignatureResponse {
  signature: string;
}

// Retrieves a user's email signature.
export const getEmailSignature = api<GetEmailSignatureParams, EmailSignatureResponse>(
  { expose: true, method: "GET", path: "/users/:userId/email-signature" },
  async (params) => {
    try {
      const user = await crmDB.queryRow<{
        email_signature: string | null;
      }>`
        SELECT email_signature FROM users WHERE id = ${params.userId}
      `;

      if (!user) {
        throw APIError.notFound("user not found");
      }

      return {
        signature: user.email_signature || '',
      };
    } catch (error) {
      console.error('Error in getEmailSignature:', error);
      throw error;
    }
  }
);
