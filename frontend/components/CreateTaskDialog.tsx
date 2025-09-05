import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  defaultPersonId?: number;
  defaultDealId?: number;
}

export function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  onTaskCreated, 
  defaultPersonId,
  defaultDealId 
}: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: undefined as number | undefined,
    personId: defaultPersonId,
    dealId: defaultDealId,
  });
  const { toast } = useToast();

  const { data: people } = useQuery({
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

  const { data: deals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      try {
        return await backend.deals.listDeals({ limit: 100 });
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        return { deals: [], total: 0 };
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        companyId: 1, // Demo company
        title: data.title,
        description: data.description || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedTo: data.assignedTo,
        personId: data.personId,
        dealId: data.dealId,
      };
      return await backend.tasks.createTask(payload);
    },
    onSuccess: () => {
      onTaskCreated();
      resetForm();
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      assignedTo: undefined,
      personId: defaultPersonId,
      dealId: defaultDealId,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Select 
              value={formData.assignedTo?.toString() || ''} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                assignedTo: value ? parseInt(value) : undefined 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                <SelectItem value="1">Admin User</SelectItem>
                <SelectItem value="2">Team Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contact">Related Contact</Label>
            <Select 
              value={formData.personId?.toString() || ''} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                personId: value ? parseInt(value) : undefined 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No contact</SelectItem>
                {people?.people.map((person) => (
                  <SelectItem key={person.id} value={person.id.toString()}>
                    {person.firstName} {person.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deal">Related Deal</Label>
            <Select 
              value={formData.dealId?.toString() || ''} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                dealId: value ? parseInt(value) : undefined 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select deal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No deal</SelectItem>
                {deals?.deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id.toString()}>
                    {deal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
