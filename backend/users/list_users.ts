import { api } from "encore.dev/api";
import { crmDB } from "./db";

export interface User {
  id: number;
  companyId: number;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'member';
}

export interface ListUsersResponse {
  users: User[];
}

// Retrieves all active users.
export const listUsers = api<void, ListUsersResponse>({
  expose: true,
  method: "GET",
  path: "/users"
}, async () => {
  const rows = await crmDB.queryAll<any>`
    SELECT id, company_id, email, first_name, last_name, role 
    FROM users 
    WHERE is_active = TRUE 
    ORDER BY first_name, last_name
  `;
  
  const users: User[] = rows.map(row => ({
    id: row.id,
    companyId: row.company_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name || undefined,
    role: row.role,
  }));

  return { users };
});
