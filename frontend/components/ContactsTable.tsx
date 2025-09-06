import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Person } from '~backend/people/list_people';

interface ContactsTableProps {
  people: Person[];
  isLoading: boolean;
}

export function ContactsTable({ people, isLoading }: ContactsTableProps) {
  const formatLastContacted = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const contacted = new Date(date);
    const diffTime = Math.abs(now.getTime() - contacted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return contacted.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New Lead':
        return <Badge variant="outline">{status}</Badge>;
      case 'Contacted':
        return <Badge variant="secondary">{status}</Badge>;
      case 'Reply Received':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">{status}</Badge>;
      case 'Closed':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="p-0">
                    <div className="h-12 bg-gray-200 animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : people.length > 0 ? (
              people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <Link to={`/contacts/${person.id}`} className="font-medium text-blue-600 hover:underline">
                      {person.firstName} {person.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{person.company?.name || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(person.status)}</TableCell>
                  <TableCell>{formatLastContacted(person.lastContactedAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
