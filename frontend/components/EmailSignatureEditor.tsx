import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Edit } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface EmailSignatureEditorProps {
  userId: number;
}

export function EmailSignatureEditor({ userId }: EmailSignatureEditorProps) {
  const [signature, setSignature] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signatureData, isLoading } = useQuery({
    queryKey: ['email-signature', userId],
    queryFn: async () => {
      try {
        return await backend.users.getEmailSignature({ userId });
      } catch (error) {
        console.error('Failed to fetch email signature:', error);
        return { signature: '' };
      }
    },
  });

  useEffect(() => {
    if (signatureData?.signature) {
      // Convert HTML to plain text for editing
      const plainText = signatureData.signature
        .replace(/<br>/g, '\n')
        .replace(/<[^>]*>/g, '');
      setSignature(plainText);
    }
  }, [signatureData]);

  const updateSignatureMutation = useMutation({
    mutationFn: async (newSignature: string) => {
      // Convert plain text to basic HTML
      const htmlSignature = newSignature
        .replace(/\n/g, '<br>')
        .trim();
      return await backend.users.updateEmailSignature({ userId, signature: htmlSignature });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-signature'] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Email signature updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Failed to update email signature:', error);
      toast({
        title: "Error",
        description: "Failed to update email signature. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSignatureMutation.mutate(signature);
  };

  const handleCancel = () => {
    if (signatureData?.signature) {
      const plainText = signatureData.signature
        .replace(/<br>/g, '\n')
        .replace(/<[^>]*>/g, '');
      setSignature(plainText);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Email Signature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Email Signature
          </CardTitle>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          This signature will be automatically added to all emails you send from the CRM.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div>
              <Label htmlFor="signature">Signature</Label>
              <Textarea
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                rows={6}
                placeholder="Enter your email signature..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use line breaks to format your signature. HTML formatting is not supported.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={updateSignatureMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateSignatureMutation.isPending ? 'Saving...' : 'Save Signature'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="min-h-20 p-3 border rounded-lg bg-gray-50">
            {signature ? (
              <div className="whitespace-pre-line text-sm text-gray-700">
                {signature}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No signature set. Click "Edit" to add your email signature.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
