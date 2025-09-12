import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { Person } from '~backend/people/list_people';

interface ContactsTableProps {
  people: Person[];
  isLoading: boolean;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
}

export function ContactsTable({ 
  people, 
  isLoading, 
  selectedIds, 
  onSelectionChange,
  sortBy,
  sortOrder,
  onSort
}: ContactsTableProps) {
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(people.map(p => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-semibold hover:bg-transparent"
      onClick={() => onSort(column)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          sortOrder === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        )}
      </span>
    </Button>
  );

  const allSelected = people.length > 0 && selectedIds.length === people.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < people.length;

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortableHeader column="name">Full Name</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="email">Email Address</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="company">Company</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="status">Status</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="owner">Owner</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="lastContacted">Last Activity</SortableHeader>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="p-0">
                    <div className="h-12 bg-gray-200 animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : people.length > 0 ? (
              people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(person.id)}
                      onCheckedChange={(checked) => handleSelectRow(person.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link to={`/contacts/${person.id}`} className="font-medium text-blue-600 hover:underline">
                      {person.firstName} {person.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{person.email || 'N/A'}</TableCell>
                  <TableCell>
                    {person.company ? (
                      <Link 
                        to={`/companies/${person.company.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {person.company.name}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(person.status)}</TableCell>
                  <TableCell>
                    {person.owner ? (
                      <span className="text-sm">
                        {person.owner.firstName} {person.owner.lastName}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>{formatLastContacted(person.lastContactedAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
