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
import { CreateCompanyDialog } from '@/components/CreateCompanyDialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CreatePersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonCreated: () => void;
  defaultCompanyId?: number;
}

export function CreatePersonDialog({ open, onOpenChange, onPersonCreated, defaultCompanyId }: CreatePersonDialogProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    status: 'New Lead',
    companyId: defaultCompanyId,
  });
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const { toast } = useToast();

  const { data: companiesData, refetch: refetchCompanies } = useQuery({
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

  const safeCompanies = Array.isArray(companiesData?.companies) 
    ? companiesData.companies.filter(c => c && c.id && c.name) 
    : [];
  
  const safeTags = Array.isArray(tagsData?.tags) 
    ? tagsData.tags.filter(t => t && t.id && t.name) 
    : [];

  const filteredCompanies = safeCompanies.filter(company =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  );

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
      status: 'New Lead',
      companyId: defaultCompanyId,
    });
    setSelectedTags([]);
    setCompanySearch('');
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

  const handleCompanyCreated = () => {
    refetchCompanies();
    setShowCreateCompanyDialog(false);
    toast({
      title: "Success",
      description: "Company created successfully!",
    });
  };

  return (
    <>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <div className="space-y-2">
                  <Select 
                    value={formData.companyId?.toString()} 
                    onValueChange={(value) => {
                      if (value === 'create-new') {
                        setShowCreateCompanyDialog(true);
                      } else {
                        setFormData(prev => ({ 
                          ...prev, 
                          companyId: value === 'no-company' ? undefined : (value ? parseInt(value) : undefined)
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or search company" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder="Search companies..."
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      <SelectItem value="no-company">No company</SelectItem>
                      <SelectItem value="create-new">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Create new company
                        </div>
                      </SelectItem>
                      {filteredCompanies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Lead">New Lead</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Reply Received">Reply Received</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {safeTags.length > 0 && (
              <div>
                <Label>Tags</Label>
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Contact'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CreateCompanyDialog
        open={showCreateCompanyDialog}
        onOpenChange={setShowCreateCompanyDialog}
        onCompanyCreated={handleCompanyCreated}
      />
    </>
  );
}
