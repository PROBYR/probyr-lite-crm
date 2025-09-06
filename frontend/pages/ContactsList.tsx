import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Filter, Tag, LayoutGrid, List } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CreatePersonDialog } from '@/components/CreatePersonDialog';
import { ContactsGrid } from '@/components/ContactsGrid';
import { ContactsTable } from '@/components/ContactsTable';
import { PaginationControls } from '@/components/PaginationControls';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'table';

export function ContactsList() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedTags, setSelectedTags] = useState<string | undefined>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['people', search, sortBy, selectedTags, pageIndex, pageSize],
    queryFn: async () => {
      try {
        const offset = pageIndex * pageSize;
        const params = {
          search: search || undefined,
          sortBy: sortBy,
          tagIds: selectedTags,
          limit: pageSize,
          offset: offset,
        };
        return await backend.people.listPeople(params);
      } catch (error) {
        console.error('Failed to fetch people:', error);
        toast({
          title: "Error",
          description: "Failed to load contacts. Please try again.",
          variant: "destructive",
        });
        return { people: [], total: 0 };
      }
    },
    placeholderData: (previousData) => previousData,
  });

  const handlePersonCreated = () => {
    refetch();
    setShowCreateDialog(false);
    toast({
      title: "Success",
      description: "Contact created successfully!",
    });
  };

  const people = data?.people || [];
  const totalCount = data?.total || 0;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            {totalCount} total contacts
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="mt-4 lg:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Filters and View Switcher */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="lastContacted">Last Contacted</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedTags} onValueChange={(v) => setSelectedTags(v === 'all-tags' ? undefined : v)}>
          <SelectTrigger className="w-full lg:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-tags">All tags</SelectItem>
            {/* Assuming tags are fetched elsewhere or not needed for this component directly */}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={cn(viewMode === 'grid' && 'bg-gray-200')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('table')}
            className={cn(viewMode === 'table' && 'bg-gray-200')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'grid' ? (
        <ContactsGrid people={people} />
      ) : (
        <ContactsTable people={people} isLoading={isLoading} />
      )}

      {/* Pagination */}
      <PaginationControls
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        setPagination={setPagination}
      />

      <CreatePersonDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPersonCreated={handlePersonCreated}
      />
    </div>
  );
}
