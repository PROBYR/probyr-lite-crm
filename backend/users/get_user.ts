import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface GetUserParams {
  id: number;
}

export interface User {
  id: number;
  companyId: number;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Retrieves a single user by ID.
export const getUser = api<GetUserParams, User>(
  { expose: true, method: "GET", path: "/users/:id" },
  async (params) => {
    try {
      const user = await crmDB.queryRow<{
        id: number;
        company_id: number;
        email: string;
        first_name: string;
        last_name: string | null;
        role: 'admin' | 'member';
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT * FROM users WHERE id = ${params.id}
      `;

      if (!user) {
        throw APIError.notFound("user not found");
      }

      return {
        id: user.id,
        companyId: user.company_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name || undefined,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      console.error('Error in getUser:', error);
      throw error;
    }
  }
);
