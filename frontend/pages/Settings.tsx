import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Mail, Users, Tag, Download, Plus, Trash, Edit, BarChart3, Key } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { InviteUserDialog } from '@/components/InviteUserDialog';
import { EditUserDialog } from '@/components/EditUserDialog';
import { ApiKeyManagement } from '@/components/ApiKeyManagement';
import { UserConnectionSettings } from '@/components/UserConnectionSettings';

export function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

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

  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => backend.users.listUsers(),
  });

  const users = useMemo(() => usersData?.users || [], [usersData]);
  const userToEdit = useMemo(() => {
    if (selectedUserIds.length !== 1) return null;
    return users.find(u => u.id === selectedUserIds[0]) || null;
  }, [selectedUserIds, users]);

  const deleteMutation = useMutation({
    mutationFn: (userIds: number[]) => backend.users.deleteUsers({ userIds }),
    onSuccess: () => {
      toast({ title: "Success", description: "User(s) deleted." });
      refetchUsers();
      setSelectedUserIds([]);
    },
    onError: (error) => {
      console.error("Failed to delete users:", error);
      toast({ title: "Error", description: "Could not delete users.", variant: "destructive" });
    },
  });

  const handleUserInvited = () => {
    refetchUsers();
    toast({ title: "Success", description: "User invited successfully!" });
  };

  const handleUserUpdated = () => {
    refetchUsers();
    toast({ title: "Success", description: "User updated successfully!" });
  };

  const handleDeleteSelected = () => {
    const idsToDelete = selectedUserIds.filter(id => id !== 1);
    if (idsToDelete.length < selectedUserIds.length) {
      toast({ title: "Info", description: "The primary admin user cannot be deleted." });
    }
    if (idsToDelete.length > 0) {
      deleteMutation.mutate(idsToDelete);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, id]);
    } else {
      setSelectedUserIds(prev => prev.filter(userId => userId !== id));
    }
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Team Management</CardTitle>
                <div className="flex gap-2">
                  {selectedUserIds.length > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} disabled={selectedUserIds.length !== 1}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={selectedUserIds.length === 0}>
                            <Trash className="w-4 h-4 mr-2" /> Delete ({selectedUserIds.length})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the selected user(s). The primary admin cannot be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  <Button onClick={() => setShowInviteDialog(true)}><Plus className="w-4 h-4 mr-2" />Invite User</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUserIds.length === users.length && users.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectRow(user.id, !!checked)}
                        />
                      </TableCell>
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

        <TabsContent value="connections" className="space-y-6">
          <UserConnectionSettings userId={1} />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <ApiKeyManagement />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" value={company?.name || ''} disabled />
                </div>
                <div>
                  <Label htmlFor="company-website">Website</Label>
                  <Input id="company-website" value={company?.website || ''} disabled />
                </div>
                <div>
                  <Label htmlFor="company-phone">Phone</Label>
                  <Input id="company-phone" value={company?.phone || ''} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Pipeline Stages</CardTitle>
              <p className="text-gray-600">Manage your sales pipeline stages.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stages?.stages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">{stage.position}</div>
                      <div>
                        <h4 className="font-medium">{stage.name}</h4>
                        <div className="flex gap-2 mt-1">
                          {stage.isWon && <Badge variant="default" className="text-xs">Won Stage</Badge>}
                          {stage.isLost && <Badge variant="destructive" className="text-xs">Lost Stage</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />Contact Tags</CardTitle>
              <p className="text-gray-600">Manage tags to categorize and organize your contacts.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tags?.tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="font-medium">{tag.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteUserDialog open={showInviteDialog} onOpenChange={setShowInviteDialog} onUserInvited={handleUserInvited} />
      <EditUserDialog user={userToEdit} open={showEditDialog} onOpenChange={setShowEditDialog} onUserUpdated={handleUserUpdated} />
    </div>
  );
}
