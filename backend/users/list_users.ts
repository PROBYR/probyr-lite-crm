import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface User {
  id: number;
  companyId: number;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'member';
  isActive: boolean;
}

export interface ListUsersResponse {
  users: User[];
}

// Retrieves all users for a company.
export const listUsers = api<void, ListUsersResponse>({
  expose: true,
  method: "GET",
  path: "/users"
}, async () => {
  try {
    const rows = await crmDB.queryAll<any>`
      SELECT id, company_id, email, first_name, last_name, role, is_active
      FROM users 
      ORDER BY first_name, last_name
    `;
    
    const users: User[] = rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      email: row.email || '',
      firstName: row.first_name || '',
      lastName: row.last_name || undefined,
      role: row.role,
      isActive: row.is_active,
    }));

    return { users };
  } catch (error) {
    console.error('Error in listUsers:', error);
    return { users: [] };
  }
});
