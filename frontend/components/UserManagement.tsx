import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit, UserX, Shield, User, MoreVertical } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { InviteUserDialog } from '@/components/InviteUserDialog';
import { EditUserDialog } from '@/components/EditUserDialog';
import type { User as UserType } from '~backend/users/list_users';

export function UserManagement() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userToEdit, setUserToEdit] = useState<UserType | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<UserType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usersData, refetch: refetchUsers, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await backend.users.listUsers();
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({
          title: "Error",
          description: "Failed to load users.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const users = useMemo(() => usersData?.users || [], [usersData]);

  const deactivateMutation = useMutation({
    mutationFn: (userIds: number[]) => backend.users.deactivateUsers({ userIds }),
    onSuccess: (data) => {
      if (data.skippedCount > 0) {
        toast({ 
          title: "Info", 
          description: `${data.deactivatedCount} user(s) deactivated. ${data.skippedCount} user(s) skipped (primary admin cannot be deactivated).` 
        });
      } else {
        toast({ 
          title: "Success", 
          description: `${data.deactivatedCount} user(s) deactivated successfully.` 
        });
      }
      refetchUsers();
      setSelectedUserIds([]);
      setUserToDeactivate(null);
    },
    onError: (error) => {
      console.error("Failed to deactivate users:", error);
      toast({ 
        title: "Error", 
        description: "Could not deactivate users. Please try again.", 
        variant: "destructive" 
      });
      setUserToDeactivate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userIds: number[]) => backend.users.deleteUsers({ userIds }),
    onSuccess: () => {
      toast({ title: "Success", description: "User(s) deleted successfully." });
      refetchUsers();
      setSelectedUserIds([]);
    },
    onError: (error) => {
      console.error("Failed to delete users:", error);
      toast({ 
        title: "Error", 
        description: "Could not delete users. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const handleUserInvited = () => {
    refetchUsers();
    setShowInviteDialog(false);
    toast({ title: "Success", description: "User invited successfully!" });
  };

  const handleUserUpdated = () => {
    refetchUsers();
    setShowEditDialog(false);
    setUserToEdit(null);
    toast({ title: "Success", description: "User updated successfully!" });
  };

  const handleEditUser = (user: UserType) => {
    setUserToEdit(user);
    setShowEditDialog(true);
  };

  const handleDeactivateUser = (user: UserType) => {
    setUserToDeactivate(user);
  };

  const confirmDeactivateUser = () => {
    if (userToDeactivate) {
      deactivateMutation.mutate([userToDeactivate.id]);
    }
  };

  const handleDeactivateSelected = () => {
    const idsToDeactivate = selectedUserIds.filter(id => {
      const user = users.find(u => u.id === id);
      return user && user.isActive;
    });

    if (idsToDeactivate.length === 0) {
      toast({ 
        title: "Info", 
        description: "No active users selected to deactivate." 
      });
      return;
    }

    deactivateMutation.mutate(idsToDeactivate);
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

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="default" className="flex items-center gap-1">
        <Shield className="w-3 h-3" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <User className="w-3 h-3" />
        Member
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="outline">Inactive</Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Management
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Manage your team members and their permissions
            </p>
          </div>
          <div className="flex gap-2">
            {selectedUserIds.length > 0 && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={selectedUserIds.length === 0}
                    >
                      <UserX className="w-4 h-4 mr-2" /> 
                      Deactivate ({selectedUserIds.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate Users</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to deactivate the selected user(s)? 
                        They will lose access to the CRM but their data will be preserved. 
                        The primary admin cannot be deactivated.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeactivateSelected}>
                        Deactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      disabled={selectedUserIds.length === 0}
                    >
                      Delete ({selectedUserIds.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Users</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete the selected user(s)? 
                        This action cannot be undone and will remove all their data. 
                        The primary admin cannot be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button onClick={() => setShowInviteDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
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
              <TableHead>Joined</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectRow(user.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    {user.id === 1 && (
                      <div className="text-xs text-gray-500">Primary Admin</div>
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {user.id !== 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          {user.isActive && (
                            <DropdownMenuItem 
                              onClick={() => handleDeactivateUser(user)}
                              className="text-orange-600"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Deactivate User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <InviteUserDialog 
        open={showInviteDialog} 
        onOpenChange={setShowInviteDialog} 
        onUserInvited={handleUserInvited} 
      />
      <EditUserDialog 
        user={userToEdit} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        onUserUpdated={handleUserUpdated} 
      />
      
      {/* Single User Deactivation Dialog */}
      <AlertDialog open={!!userToDeactivate} onOpenChange={(open) => !open && setUserToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {userToDeactivate?.firstName} {userToDeactivate?.lastName}? 
              Their access will be revoked immediately, but their data will be preserved for historical records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDeactivate(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivateUser}>
              Deactivate User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
