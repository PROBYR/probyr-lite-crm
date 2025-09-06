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

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSent: () => void;
  personId: number;
  personEmail: string;
}

export function SendEmailDialog({ open, onOpenChange, onEmailSent, personId, personEmail }: SendEmailDialogProps) {
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
  });
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await backend.outreach.sendEmail({
        personId,
        fromUserId: 1, // Assuming current user is 1
        subject: data.subject,
        body: data.body,
      });
    },
    onSuccess: () => {
      onEmailSent();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Failed to send email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.body) {
      toast({
        title: "Error",
        description: "Subject and body are required.",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Sales Email</DialogTitle>
          <DialogDescription>
            Compose and send a one-to-one email. It will be logged to the contact's timeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>To</Label>
            <Input value={personEmail} disabled />
          </div>
          <div>
            <Label htmlFor="email-subject">Subject *</Label>
            <Input
              id="email-subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email-body">Body *</Label>
            <Textarea
              id="email-body"
              rows={8}
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
