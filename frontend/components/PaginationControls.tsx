import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  setPagination: (updater: React.SetStateAction<{ pageIndex: number; pageSize: number }>) => void;
}

export function PaginationControls({
  pageIndex,
  pageSize,
  totalCount,
  setPagination,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePreviousPage = () => {
    setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }));
  };

  const handleNextPage = () => {
    setPagination(prev => ({ ...prev, pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1) }));
  };

  const handlePageSizeChange = (value: string) => {
    setPagination({ pageIndex: 0, pageSize: Number(value) });
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-gray-600">
        {totalCount > 0
          ? `Showing ${pageIndex * pageSize + 1} - ${Math.min(
              (pageIndex + 1) * pageSize,
              totalCount
            )} of ${totalCount} contacts`
          : 'No contacts'}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Rows per page:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100].map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-medium">
          Page {pageIndex + 1} of {totalPages > 0 ? totalPages : 1}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={pageIndex >= totalPages - 1}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
