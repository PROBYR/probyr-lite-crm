import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

interface CreatePersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonCreated: () => void;
}

export function CreatePersonDialog({ open, onOpenChange, onPersonCreated }: CreatePersonDialogProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    companyId: undefined as number | undefined,
  });
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const { toast } = useToast();

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const result = await backend.company.listCompanies();
        // Ensure we always return a proper structure
        return result || { companies: [] };
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        // Return safe fallback instead of throwing
        return { companies: [] };
      }
    },
    // Add default data to prevent undefined state
    initialData: { companies: [] },
    // Prevent aggressive refetching that might cause undefined states
    staleTime: 30000,
    retry: (failureCount, error) => {
      // Limit retries to prevent endless undefined states
      return failureCount < 2;
    },
  });

  const { data: tagsData, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      try {
        const result = await backend.tags.listTags({});
        // Ensure we always return a proper structure
        return result || { tags: [] };
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        // Return safe fallback instead of throwing
        return { tags: [] };
      }
    },
    // Add default data to prevent undefined state
    initialData: { tags: [] },
    // Prevent aggressive refetching that might cause undefined states
    staleTime: 30000,
    retry: (failureCount, error) => {
      // Limit retries to prevent endless undefined states
      return failureCount < 2;
    },
  });

  // Multiple layers of safety for array access
  const safeCompanies = React.useMemo(() => {
    // First check if data exists and has companies property
    if (!companiesData || typeof companiesData !== 'object') {
      return [];
    }
    
    // Then check if companies is an array
    if (!Array.isArray(companiesData.companies)) {
      return [];
    }
    
    // Finally filter with additional safety checks
    return companiesData.companies.filter(company => {
      return (
        company && 
        typeof company === 'object' && 
        typeof company.id === 'number' && 
        typeof company.name === 'string' && 
        company.name.trim().length > 0
      );
    });
  }, [companiesData]);

  const safeTags = React.useMemo(() => {
    // First check if data exists and has tags property
    if (!tagsData || typeof tagsData !== 'object') {
      return [];
    }
    
    // Then check if tags is an array
    if (!Array.isArray(tagsData.tags)) {
      return [];
    }
    
    // Finally filter with additional safety checks
    return tagsData.tags.filter(tag => {
      return (
        tag && 
        typeof tag === 'object' && 
        typeof tag.id === 'number' && 
        typeof tag.name === 'string' && 
        tag.name.trim().length > 0 &&
        typeof tag.color === 'string'
      );
    });
  }, [tagsData]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { tagIds: number[] }) => {
      return await backend.people.createPerson(data);
    },
    onSuccess: () => {
      onPersonCreated();
      resetForm();
    },
    onError: (error) => {
      console.error('Failed to create person:', error);
      toast({
        title: "Error",
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      companyId: undefined,
    });
    setSelectedTags([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast({
        title: "Error",
        description: "First name is required.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...formData,
      tagIds: selectedTags,
    });
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="create-person-dialog-desc">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription id="create-person-dialog-desc">
            Add a new contact to your CRM. Fill in their details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Select 
              value={formData.companyId?.toString()} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                companyId: value === 'no-company' ? undefined : (value ? parseInt(value) : undefined)
              }))}
              disabled={companiesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={companiesLoading ? "Loading companies..." : "Select company"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-company">No company</SelectItem>
                {safeCompanies.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </SelectItem>
                ))}
                {safeCompanies.length === 0 && !companiesLoading && (
                  <SelectItem value="no-companies" disabled>
                    No companies available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {safeTags.length > 0 && (
            <div>
              <Label>Tags</Label>
              {tagsLoading ? (
                <div className="text-sm text-gray-500 mt-2">Loading tags...</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {safeTags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={() => handleTagToggle(tag.id)}
                      />
                      <Label 
                        htmlFor={`tag-${tag.id}`}
                        className="flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || companiesLoading || tagsLoading}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
