import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Exports contacts to CSV format.
export const exportContacts = api({ expose: true, method: "POST", path: "/people/export-contacts" }, async (req) => {
    try {
        if (req.personIds.length === 0) {
            return { csvData: '', filename: '' };
        }
        // Fetch the selected contacts with full details
        const query = `
        SELECT 
          p.id,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          p.job_title,
          p.status,
          p.last_contacted_at,
          p.created_at,
          p.updated_at,
          c.name as company_name,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name,
          STRING_AGG(t.name, '; ') as tags
        FROM people p
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users u ON p.assigned_to = u.id
        LEFT JOIN contact_tags ct ON p.id = ct.person_id
        LEFT JOIN tags t ON ct.tag_id = t.id
        WHERE p.id = ANY($1)
        GROUP BY p.id, c.name, u.first_name, u.last_name
        ORDER BY p.first_name, p.last_name
      `;
        const rows = await crmDB.rawQueryAll(query, req.personIds);
        // Generate CSV content
        const headers = [
            'ID',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Job Title',
            'Company',
            'Status',
            'Owner',
            'Tags',
            'Last Contacted',
            'Created Date',
            'Updated Date'
        ];
        const csvRows = rows.map(row => [
            row.id.toString(),
            row.first_name || '',
            row.last_name || '',
            row.email || '',
            row.phone || '',
            row.job_title || '',
            row.company_name || '',
            row.status || '',
            row.owner_first_name ? `${row.owner_first_name} ${row.owner_last_name || ''}`.trim() : '',
            row.tags || '',
            row.last_contacted_at ? new Date(row.last_contacted_at).toLocaleDateString() : '',
            new Date(row.created_at).toLocaleDateString(),
            new Date(row.updated_at).toLocaleDateString()
        ]);
        // Escape CSV values
        const escapeCsvValue = (value) => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(escapeCsvValue).join(','))
        ].join('\n');
        const today = new Date().toISOString().split('T')[0];
        const filename = `probyr-crm-export-${today}.csv`;
        return { csvData: csvContent, filename };
    }
    catch (error) {
        console.error('Error in exportContacts:', error);
        throw error;
    }
});
//# sourceMappingURL=export_contacts.js.map