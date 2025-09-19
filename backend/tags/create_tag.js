import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Creates a new tag.
export const createTag = api({ expose: true, method: "POST", path: "/tags" }, async (req) => {
    const color = req.color || '#3B82F6';
    const tagRow = await crmDB.queryRow `
      INSERT INTO tags (company_id, name, color, created_at)
      VALUES (${req.companyId}, ${req.name}, ${color}, NOW())
      RETURNING *
    `;
    if (!tagRow) {
        throw new Error("Failed to create tag");
    }
    return {
        id: tagRow.id,
        companyId: tagRow.company_id,
        name: tagRow.name,
        color: tagRow.color,
        createdAt: tagRow.created_at,
    };
});
//# sourceMappingURL=create_tag.js.map