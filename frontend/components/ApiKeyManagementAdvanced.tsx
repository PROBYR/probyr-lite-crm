import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Shield } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

const AVAILABLE_PERMISSIONS = [
  {
    id: 'leads:create',
    label: 'Create Leads',
    description: 'Allows creating new contacts, companies, and deals',
  },
  {
    id: 'contacts:read',
    label: 'Read Contacts',
    description: 'Allows reading contact information',
  },
];

export function ApiKeyManagementAdvanced() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ 
    name: '', 
    description: '',
    permissions: [] as string[]
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeysData, refetch } = useQuery({
    queryKey: ['api-keys-detailed'],
    queryFn: async () => {
      try {
        return await backend.api_auth.listApiKeysWithPermissions({ companyId: 1 });
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
        return { apiKeys: [] };
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissions: string[] }) => {
      return await backend.api_auth.createApiKey({
        companyId: 1,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      });
    },
    onSuccess: (data) => {
      setGeneratedKey(data.fullKey);
      setShowGeneratedKey(true);
      refetch();
      setNewKeyData({ name: '', description: '', permissions: [] });
      toast({
        title: "Success",
        description: "API key generated successfully!",
      });
    },
    onError: (error) => {
      console.error('Failed to generate API key:', error);
      toast({
        title: "Error",
        description: "Failed to generate API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await backend.api_auth.revokeApiKey({ id });
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Success",
        description: "API key revoked successfully!",
      });
    },
    onError: (error) => {
      console.error('Failed to revoke API key:', error);
      toast({
        title: "Error",
        description: "Failed to revoke API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateKey = () => {
    if (!newKeyData.name.trim()) {
      toast({
        title: "Error",
        description: "API key name is required.",
        variant: "destructive",
      });
      return;
    }

    if (newKeyData.permissions.length === 0) {
      toast({
        title: "Error",
        description: "At least one permission must be selected.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(newKeyData);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setNewKeyData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard!",
    });
  };

  const getPermissionLabel = (permissionId: string) => {
    const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId);
    return permission?.label || permissionId;
  };

  const apiKeys = apiKeysData?.apiKeys || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Management
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Generate API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for integrating with external applications. 
                  Choose specific permissions to control what this key can access.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key-name">Name *</Label>
                  <Input
                    id="key-name"
                    value={newKeyData.name}
                    onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Smartlead Integration"
                  />
                </div>
                <div>
                  <Label htmlFor="key-description">Description</Label>
                  <Textarea
                    id="key-description"
                    value={newKeyData.description}
                    onChange={(e) => setNewKeyData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this API key will be used for..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Permissions *</Label>
                  <div className="space-y-3 mt-2">
                    {AVAILABLE_PERMISSIONS.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={permission.id}
                          checked={newKeyData.permissions.includes(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <div className="space-y-1 leading-none">
                          <Label 
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.label}
                          </Label>
                          <p className="text-xs text-gray-500">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateKey} disabled={generateMutation.isPending}>
                    {generateMutation.isPending ? 'Generating...' : 'Generate Key'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-gray-600">
          Manage API keys for third-party integrations. Each key can have specific permissions to control access to your data.
        </p>
      </CardHeader>
      <CardContent>
        {/* Generated Key Display */}
        {generatedKey && showGeneratedKey && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              ⚠️ Important: Save Your API Key
            </h4>
            <p className="text-sm text-yellow-700 mb-3">
              This is the only time you'll see this API key. Copy it now and store it securely.
            </p>
            <div className="flex items-center gap-2">
              <Input value={generatedKey} readOnly className="font-mono text-sm" />
              <Button size="sm" onClick={() => copyToClipboard(generatedKey)}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowGeneratedKey(false)}>
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* API Keys Table */}
        {apiKeys.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{key.name}</div>
                      {key.description && (
                        <div className="text-sm text-gray-500">{key.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {key.keyPrefix}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {getPermissionLabel(permission)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.isActive ? "default" : "secondary"}>
                      {key.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {key.isActive && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke this API key? This action cannot be undone and will immediately disable all integrations using this key.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeMutation.mutate(key.id)}>
                              Revoke Key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No API keys generated yet</p>
            <p className="text-sm mt-1">Create your first API key to enable third-party integrations</p>
          </div>
        )}

        {/* API Documentation Section */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-medium text-gray-900 mb-3">API Documentation</h4>
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">Create Lead Endpoint</h5>
              <code className="text-xs bg-white px-2 py-1 rounded border">
                POST /api/v1/leads
              </code>
              <p className="text-gray-600 mt-2">
                Creates a new lead with contact, company, and deal information. 
                Requires <code>leads:create</code> permission.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">Get Contacts Endpoint</h5>
              <code className="text-xs bg-white px-2 py-1 rounded border">
                GET /api/v1/contacts
              </code>
              <p className="text-gray-600 mt-2">
                Retrieves contact information with pagination support. 
                Requires <code>contacts:read</code> permission.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">Authentication</h5>
              <p className="text-gray-600">
                Include your API key in the Authorization header:
              </p>
              <code className="text-xs bg-white px-2 py-1 rounded border mt-1 block">
                Authorization: Bearer pbr_your_api_key_here
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
