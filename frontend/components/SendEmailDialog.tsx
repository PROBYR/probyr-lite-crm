import React, { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail, Settings } from 'lucide-react';
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
    trackOpens: true,
    trackClicks: true,
  });
  const { toast } = useToast();

  // Check if user has email connection
  const { data: userConnections } = useQuery({
    queryKey: ['user-connections', 1], // Demo user ID
    queryFn: async () => {
      try {
        return await backend.user_connections.getUserConnections({ userId: 1 });
      } catch (error) {
        console.error('Failed to fetch user connections:', error);
        return {};
      }
    },
  });

  // Get user's email signature
  const { data: signatureData } = useQuery({
    queryKey: ['email-signature', 1], // Demo user ID
    queryFn: async () => {
      try {
        return await backend.users.getEmailSignature({ userId: 1 });
      } catch (error) {
        console.error('Failed to fetch email signature:', error);
        return { signature: '' };
      }
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await backend.outreach.sendEmailWithTracking({
        personId,
        fromUserId: 1, // Demo user
        subject: data.subject,
        body: data.body,
        trackOpens: data.trackOpens,
        trackClicks: data.trackClicks,
      });
    },
    onSuccess: () => {
      onEmailSent();
      resetForm();
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Email sent successfully!",
      });
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

  const resetForm = () => {
    setFormData({
      subject: '',
      body: '',
      trackOpens: true,
      trackClicks: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userConnections?.email) {
      toast({
        title: "Email Account Required",
        description: "Please connect your email account in Settings before sending emails.",
        variant: "destructive",
      });
      return;
    }

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

  // Add signature preview when dialog opens
  useEffect(() => {
    if (open && signatureData?.signature && !formData.body.includes(signatureData.signature)) {
      // Only auto-add signature if body is empty or doesn't already contain it
      if (!formData.body.trim()) {
        setFormData(prev => ({
          ...prev,
          body: prev.body + (prev.body ? '\n\n' : '') + '-- \n' + signatureData.signature.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')
        }));
      }
    }
  }, [open, signatureData?.signature]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const hasEmailConnection = !!userConnections?.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Sales Email
          </DialogTitle>
          <DialogDescription>
            Compose and send a tracked email. It will be logged to the contact's timeline.
          </DialogDescription>
        </DialogHeader>

        {!hasEmailConnection && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <span>Connect your email account to send emails from the CRM.</span>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/settings'}>
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>To</Label>
            <Input value={personEmail} disabled className="bg-gray-50" />
          </div>
          
          <div>
            <Label htmlFor="email-subject">Subject *</Label>
            <Input
              id="email-subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject"
              disabled={!hasEmailConnection}
            />
          </div>
          
          <div>
            <Label htmlFor="email-body">Body *</Label>
            <Textarea
              id="email-body"
              rows={12}
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Type your email message here..."
              disabled={!hasEmailConnection}
            />
            {signatureData?.signature && (
              <p className="text-xs text-gray-500 mt-1">
                Your email signature will be automatically added.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tracking Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="track-opens"
                  checked={formData.trackOpens}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackOpens: !!checked }))}
                  disabled={!hasEmailConnection}
                />
                <Label htmlFor="track-opens" className="text-sm">Track email opens</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="track-clicks"
                  checked={formData.trackClicks}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackClicks: !!checked }))}
                  disabled={!hasEmailConnection}
                />
                <Label htmlFor="track-clicks" className="text-sm">Track link clicks</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={sendEmailMutation.isPending || !hasEmailConnection}
            >
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
