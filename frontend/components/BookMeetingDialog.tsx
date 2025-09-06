import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { useToast } from '@/components/ui/use-toast';

interface BookMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingBooked: () => void;
  personId: number;
}

export function BookMeetingDialog({ open, onOpenChange, onMeetingBooked, personId }: BookMeetingDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const { toast } = useToast();

  const bookMeetingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await backend.outreach.bookMeeting({
        personId,
        userId: 1, // Assuming current user is 1
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      });
    },
    onSuccess: () => {
      onMeetingBooked();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Failed to book meeting:', error);
      toast({
        title: "Error",
        description: "Failed to book meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast({
        title: "Error",
        description: "Title, start time, and end time are required.",
        variant: "destructive",
      });
      return;
    }
    bookMeetingMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a Meeting</DialogTitle>
          <DialogDescription>
            Schedule a new meeting and log it to the contact's timeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="meeting-title">Title *</Label>
            <Input
              id="meeting-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="meeting-description">Description</Label>
            <Textarea
              id="meeting-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="meeting-start">Start Time *</Label>
              <Input
                id="meeting-start"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="meeting-end">End Time *</Label>
              <Input
                id="meeting-end"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={bookMeetingMutation.isPending}>
              {bookMeetingMutation.isPending ? 'Booking...' : 'Book Meeting'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
