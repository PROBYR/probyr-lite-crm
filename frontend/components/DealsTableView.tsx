import React from 'react';
import { ChevronUp, ChevronDown, Building, User } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DealTableRow {
  id: number;
  title: string;
  value?: number;
  expectedCloseDate?: Date;
  probability: number;
  createdAt: Date;
  updatedAt: Date;
  person?: {
    id: number;
    firstName: string;
    lastName?: string;
  };
  company?: {
    id: number;
    name: string;
  };
  stage: {
    id: number;
    name: string;
    position: number;
    isWon: boolean;
    isLost: boolean;
  };
  owner?: {
    id: number;
    firstName: string;
    lastName?: string;
  };
}

interface DealsTableViewProps {
  deals: DealTableRow[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
}

export function DealsTableView({ deals, isLoading, sortBy, sortOrder, onSort }: DealsTableViewProps) {
  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (stage: { isWon: boolean; isLost: boolean; name: string }) => {
    if (stage.isWon) {
      return <Badge variant="default" className="bg-green-600">Won</Badge>;
    }
    if (stage.isLost) {
      return <Badge variant="destructive">Lost</Badge>;
    }
    return <Badge variant="outline">{stage.name}</Badge>;
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

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader column="title">Deal Name</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="company">Company</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="value">Value</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="stage">Stage</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="owner">Owner</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="expected_close">Expected Close</SortableHeader>
              </TableHead>
              <TableHead>Probability</TableHead>
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
            ) : deals.length > 0 ? (
              deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{deal.title}</div>
                    {deal.person && (
                      <div className="text-sm text-gray-500">
                        {deal.person.firstName} {deal.person.lastName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.company ? (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{deal.company.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No company</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.value && deal.value > 0 ? (
                      <span className="font-medium text-green-600">
                        {formatCurrency(deal.value)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(deal.stage)}
                  </TableCell>
                  <TableCell>
                    {deal.owner ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{deal.owner.firstName} {deal.owner.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.expectedCloseDate ? (
                      formatDate(deal.expectedCloseDate)
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{deal.probability}%</span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No deals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
