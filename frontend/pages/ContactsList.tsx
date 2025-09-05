import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, Tag, Phone, Mail, User } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CreatePersonDialog } from '@/components/CreatePersonDialog';

export function ContactsList() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedTags, setSelectedTags] = useState<string | undefined>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const { data: peopleData, isLoading: peopleLoading, refetch: refetchPeople } = useQuery({
    queryKey: ['people', search, sortBy, selectedTags],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (sortBy) params.set('sortBy', sortBy);
        if (selectedTags) params.set('tagIds', selectedTags);
        
        return await backend.people.listPeople(Object.fromEntries(params));
      } catch (error) {
        console.error('Failed to fetch people:', error);
        toast({
          title: "Error",
          description: "Failed to load contacts. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      try {
        return await backend.tags.listTags({});
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        toast({
          title: "Error",
          description: "Failed to load tags. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const handlePersonCreated = () => {
    refetchPeople();
    setShowCreateDialog(false);
    toast({
      title: "Success",
      description: "Contact created successfully!",
    });
  };

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

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            {peopleData?.total || 0} total contacts
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="mt-4 lg:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Filters */}
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
            {tagsData?.tags.map((tag) => (
              <SelectItem key={tag.id} value={String(tag.id)}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Grid */}
      {peopleLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {peopleData?.people.map((person) => (
            <Link key={person.id} to={`/contacts/${person.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    {person.firstName} {person.lastName}
                  </CardTitle>
                  {person.jobTitle && (
                    <p className="text-sm text-gray-600">{person.jobTitle}</p>
                  )}
                  {person.company && (
                    <p className="text-sm text-gray-500">{person.company.name}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {person.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{person.email}</span>
                    </div>
                  )}
                  
                  {person.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{person.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Last contacted: {formatLastContacted(person.lastContactedAt)}
                    </span>
                  </div>
                  
                  {person.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {person.tags.slice(0, 3).map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="secondary" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: tag.color 
                          }}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                      {person.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{person.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {peopleData?.people.length === 0 && !peopleLoading && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-600 mb-4">
            {search ? 'Try adjusting your search or filters.' : 'Get started by adding your first contact.'}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      )}

      <CreatePersonDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPersonCreated={handlePersonCreated}
      />
    </div>
  );
}
