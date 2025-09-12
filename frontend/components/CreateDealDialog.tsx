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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealCreated: () => void;
  defaultPersonId?: number;
  defaultPipelineId?: number;
}

export function CreateDealDialog({ 
  open, 
  onOpenChange, 
  onDealCreated, 
  defaultPersonId,
  defaultPipelineId
}: CreateDealDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    expectedCloseDate: '',
    probability: '50',
    notes: '',
    personId: defaultPersonId,
    stageId: undefined as number | undefined,
    assignedTo: undefined as number | undefined,
  });
  const { toast } = useToast();

  const { data: peopleData } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      try {
        return await backend.people.listPeople({ limit: 100 });
      } catch (error) {
        console.error('Failed to fetch people:', error);
        return { people: [], total: 0 };
      }
    },
  });

  const { data: stagesData } = useQuery({
    queryKey: ['stages', defaultPipelineId],
    queryFn: async () => {
      try {
        const params = defaultPipelineId ? { pipelineId: defaultPipelineId } : {};
        return await backend.stages.listStages(params);
      } catch (error) {
        console.error('Failed to fetch stages:', error);
        return { stages: [] };
      }
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await backend.users.listUsers();
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return { users: [] };
      }
    },
  });

  // Defensive defaults - always use arrays
  const safePeople = (peopleData?.people ?? []).filter(p => p && p.id);
  const safeStages = (stagesData?.stages ?? []).filter(s => s && s.id);
  const safeUsers = (usersData?.users ?? []).filter(u => u && u.id && u.isActive);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        companyId: 1, // Demo company
        title: data.title,
        value: data.value ? parseFloat(data.value) : undefined,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        probability: parseInt(data.probability),
        notes: data.notes || undefined,
        personId: data.personId,
        stageId: data.stageId || safeStages[0]?.id || 1, // Default to first stage
        assignedTo: data.assignedTo,
      };
      return await backend.deals.createDeal(payload);
    },
    onSuccess: () => {
      onDealCreated();
      resetForm();
    },
    onError: (error) => {
      console.error('Failed to create deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      value: '',
      expectedCloseDate: '',
      probability: '50',
      notes: '',
      personId: defaultPersonId,
      stageId: undefined,
      assignedTo: undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Deal title is required.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="create-deal-dialog-desc">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription id="create-deal-dialog-desc">
            Create a new deal to track its progress through your sales pipeline.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact">Contact</Label>
            <Select 
              value={formData.personId?.toString()} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                personId: value === 'no-contact' ? undefined : (value ? parseInt(value) : undefined)
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-contact">No contact</SelectItem>
                {safePeople.map((person) => (
                  <SelectItem key={person.id} value={String(person.id)}>
                    {person.firstName || 'Unnamed'} {person.lastName || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="stage">Stage</Label>
            <Select 
              value={formData.stageId?.toString()} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                stageId: value ? parseInt(value) : undefined 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {safeStages.map((stage) => (
                  <SelectItem key={stage.id} value={String(stage.id)}>
                    {stage.name || 'Unnamed Stage'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assigned-to">Assigned To</Label>
            <Select 
              value={formData.assignedTo?.toString()} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                assignedTo: value === 'unassigned' ? undefined : (value ? parseInt(value) : undefined)
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {safeUsers.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.firstName || 'Unnamed'} {user.lastName || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">Value ($)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData(prev => ({ ...prev, probability: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
