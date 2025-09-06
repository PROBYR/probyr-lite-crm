import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Mail, Users, Tag, Download, Plus } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { InviteUserDialog } from '@/components/InviteUserDialog';

export function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const { data: company } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => (await backend.company.listCompanies()).companies[0],
  });

  const { data: stages } = useQuery({
    queryKey: ['stages'],
    queryFn: () => backend.stages.listStages({}),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => backend.tags.listTags({}),
  });

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => backend.users.listUsers(),
  });

  const handleUserInvited = () => {
    refetchUsers();
    toast({ title: "Success", description: "User invited successfully!" });
  };

  const handleExportContacts = async () => {
    // ... (existing export logic)
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your CRM configuration and preferences</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Team Management</CardTitle>
                <Button onClick={() => setShowInviteDialog(true)}><Plus className="w-4 h-4 mr-2" />Invite User</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'outline'}>
                          {user.isActive ? 'Active' : 'Invited'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          {/* Existing General Tab Content */}
        </TabsContent>
        <TabsContent value="pipeline" className="space-y-6">
          {/* Existing Pipeline Tab Content */}
        </TabsContent>
        <TabsContent value="tags" className="space-y-6">
          {/* Existing Tags Tab Content */}
        </TabsContent>
      </Tabs>

      <InviteUserDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onUserInvited={handleUserInvited}
      />
    </div>
  );
}
