import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";

export interface DeletePersonParams {
  id: number;
}

// Deletes a person.
export const deletePerson = api<DeletePersonParams, void>(
  { expose: true, method: "DELETE", path: "/people/:id" },
  async (params) => {
    const result = await crmDB.exec`
      DELETE FROM people WHERE id = ${params.id}
    `;

    // Note: In real implementation, you might want to check if any rows were affected
    // and throw an error if the person wasn't found
  }
);
