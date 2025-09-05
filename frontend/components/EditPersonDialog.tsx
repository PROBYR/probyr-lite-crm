import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import type { Person } from '~backend/people/get_person';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

interface EditPersonDialogProps {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonUpdated: () => void;
}

export function EditPersonDialog({ person, open, onOpenChange, onPersonUpdated }: EditPersonDialogProps) {
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

  useEffect(() => {
    if (person) {
      setFormData({
        firstName: person.firstName || '',
        lastName: person.lastName || '',
        email: person.email || '',
        phone: person.phone || '',
        jobTitle: person.jobTitle || '',
        companyId: person.companyId,
      });
      setSelectedTags(person.tags.map(tag => tag.id));
    }
  }, [person, open]);

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        return await backend.company.listCompanies();
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        return { companies: [] };
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
        return { tags: [] };
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { tagIds: number[] }) => {
      return await backend.people.updatePerson({
        id: person.id,
        ...data,
      });
    },
    onSuccess: () => {
      onPersonUpdated();
    },
    onError: (error) => {
      console.error('Failed to update person:', error);
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    },
  });

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

    updateMutation.mutate({
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-firstName">First Name *</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit-jobTitle">Job Title</Label>
            <Input
              id="edit-jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit-company">Company</Label>
            <Select 
              value={formData.companyId?.toString()} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                companyId: value === 'no-company' ? undefined : (value ? parseInt(value) : undefined)
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-company">No company</SelectItem>
                {companiesData?.companies
                  .filter(c => c.id)
                  .map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name || 'Unnamed Company'}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tagsData && tagsData.tags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {tagsData.tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <Label 
                      htmlFor={`edit-tag-${tag.id}`}
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
