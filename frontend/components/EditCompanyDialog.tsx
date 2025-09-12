import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import backend from '~backend/client';
import type { Company } from '~backend/company/get_company';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface EditCompanyDialogProps {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyUpdated: () => void;
}

export function EditCompanyDialog({ company, open, onOpenChange, onCompanyUpdated }: EditCompanyDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    address: '',
    phone: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        website: company.website || '',
        industry: (company as any).industry || '',
        address: company.address || '',
        phone: company.phone || '',
      });
    }
  }, [company, open]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await backend.company.updateCompany({
        id: company.id,
        name: data.name,
        website: data.website || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
      });
    },
    onSuccess: () => {
      onCompanyUpdated();
    },
    onError: (error) => {
      console.error('Failed to update company:', error);
      toast({
        title: "Error",
        description: "Failed to update company. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="edit-company-dialog-desc">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription id="edit-company-dialog-desc">
            Make changes to this company's profile. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-company-name">Company Name *</Label>
            <Input
              id="edit-company-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-company-website">Website</Label>
            <Input
              id="edit-company-website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.example.com"
            />
          </div>

          <div>
            <Label htmlFor="edit-company-industry">Industry</Label>
            <Input
              id="edit-company-industry"
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              placeholder="Technology, Healthcare, Finance, etc."
            />
          </div>

          <div>
            <Label htmlFor="edit-company-phone">Phone</Label>
            <Input
              id="edit-company-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="edit-company-address">Address</Label>
            <Textarea
              id="edit-company-address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main Street, City, State, ZIP"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Company'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
