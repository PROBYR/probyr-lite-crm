import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface UpdateUserParams {
  id: number;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'member';
  isActive?: boolean;
}

export interface User {
  id: number;
  companyId: number;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'member';
  isActive: boolean;
}

// Updates an existing user.
export const updateUser = api<UpdateUserParams & UpdateUserRequest, User>(
  { expose: true, method: "PUT", path: "/users/:id" },
  async (req) => {
    const user = await crmDB.queryRow<User>`
      SELECT * FROM users WHERE id = ${req.id}
    `;
    if (!user) {
      throw APIError.notFound("user not found");
    }

    // Prevent changing the main admin's role or deactivating them
    if (user.id === 1 && (req.role !== 'admin' || req.isActive === false)) {
        throw APIError.permissionDenied("cannot modify the primary admin user");
    }

    const updatedFirstName = req.firstName ?? user.firstName;
    const updatedLastName = req.lastName ?? user.lastName;
    const updatedRole = req.role ?? user.role;
    const updatedIsActive = req.isActive ?? user.isActive;

    const updatedUser = await crmDB.queryRow<User>`
      UPDATE users
      SET first_name = ${updatedFirstName},
          last_name = ${updatedLastName},
          role = ${updatedRole},
          is_active = ${updatedIsActive},
          updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, company_id, email, first_name, last_name, role, is_active
    `;

    if (!updatedUser) {
      throw new Error("Failed to update user");
    }

    return {
        id: updatedUser.id,
        companyId: updatedUser.companyId,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
    };
  }
);
