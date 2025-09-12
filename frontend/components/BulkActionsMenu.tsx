import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  MoreHorizontal, 
  UserPlus, 
  Trash2, 
  Download, 
  Tag,
  AlertTriangle
} from 'lucide-react';
import backend from '~backend/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

interface BulkActionsMenuProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onRefresh: () => void;
}

export function BulkActionsMenu({ selectedIds, onSelectionChange, onRefresh }: BulkActionsMenuProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagOperation, setTagOperation] = useState<'add' | 'remove'>('add');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      try {
        return await backend.tags.listTags({});
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        return { tags: [] };
      }
    },
  });

  const assignOwnerMutation = useMutation({
    mutationFn: async (data: { personIds: number[]; userId?: number }) => {
      return await backend.people.assignOwner(data);
    },
    onSuccess: (data) => {
      onRefresh();
      onSelectionChange([]);
      setShowAssignDialog(false);
      toast({
        title: "Success",
        description: `Updated ${data.updatedCount} contacts successfully!`,
      });
    },
    onError: (error) => {
      console.error('Failed to assign owner:', error);
      toast({
        title: "Error",
        description: "Failed to assign owner. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkTagUpdateMutation = useMutation({
    mutationFn: async (data: { personIds: number[]; tagIds: number[]; operation: 'add' | 'remove' }) => {
      return await backend.people.bulkTagUpdate(data);
    },
    onSuccess: (data) => {
      onRefresh();
      onSelectionChange([]);
      setShowTagDialog(false);
      toast({
        title: "Success",
        description: `Updated tags for ${data.updatedCount} contacts successfully!`,
      });
    },
    onError: (error) => {
      console.error('Failed to update tags:', error);
      toast({
        title: "Error",
        description: "Failed to update tags. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteContactsMutation = useMutation({
    mutationFn: async (data: { personIds: number[] }) => {
      return await backend.people.deleteContacts(data);
    },
    onSuccess: (data) => {
      onRefresh();
      onSelectionChange([]);
      setShowDeleteDialog(false);
      toast({
        title: "Success",
        description: `Deleted ${data.deletedCount} contacts successfully!`,
      });
    },
    onError: (error) => {
      console.error('Failed to delete contacts:', error);
      toast({
        title: "Error",
        description: "Failed to delete contacts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportContactsMutation = useMutation({
    mutationFn: async (data: { personIds: number[] }) => {
      return await backend.people.exportContacts(data);
    },
    onSuccess: (data) => {
      // Create and trigger download
      const blob = new Blob([data.csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Exported ${selectedIds.length} contacts to CSV!`,
      });
    },
    onError: (error) => {
      console.error('Failed to export contacts:', error);
      toast({
        title: "Error",
        description: "Failed to export contacts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAssignOwner = () => {
    const userId = selectedUserId === 'unassigned' ? undefined : parseInt(selectedUserId);
    assignOwnerMutation.mutate({ personIds: selectedIds, userId });
  };

  const handleTagUpdate = () => {
    if (selectedTagIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one tag.",
        variant: "destructive",
      });
      return;
    }
    bulkTagUpdateMutation.mutate({ 
      personIds: selectedIds, 
      tagIds: selectedTagIds, 
      operation: tagOperation 
    });
  };

  const handleDelete = () => {
    deleteContactsMutation.mutate({ personIds: selectedIds });
  };

  const handleExport = () => {
    exportContactsMutation.mutate({ personIds: selectedIds });
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const users = usersData?.users || [];
  const tags = tagsData?.tags || [];

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <span className="text-sm font-medium text-blue-900">
          {selectedIds.length} contact{selectedIds.length !== 1 ? 's' : ''} selected
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4 mr-2" />
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setShowAssignDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Owner
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowTagDialog(true)}>
              <Tag className="w-4 h-4 mr-2" />
              Add/Remove Tags
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Contacts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onSelectionChange([])}
          className="ml-auto"
        >
          Clear Selection
        </Button>
      </div>

      {/* Assign Owner Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Owner</DialogTitle>
            <DialogDescription>
              Select a team member to assign as owner for {selectedIds.length} contact{selectedIds.length !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="owner-select">Owner</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.filter(u => u.isActive).map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignOwner}
              disabled={assignOwnerMutation.isPending}
            >
              {assignOwnerMutation.isPending ? 'Assigning...' : 'Assign Owner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Management Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add or remove tags from {selectedIds.length} contact{selectedIds.length !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Operation</Label>
              <Select value={tagOperation} onValueChange={(value: 'add' | 'remove') => setTagOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Tags</SelectItem>
                  <SelectItem value="remove">Remove Tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {tags.length > 0 && (
              <div>
                <Label>Tags</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => handleTagToggle(tag.id)}
                      />
                      <Label 
                        htmlFor={`tag-${tag.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTagUpdate}
              disabled={bulkTagUpdateMutation.isPending}
            >
              {bulkTagUpdateMutation.isPending ? 'Updating...' : 'Update Tags'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Contacts
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete these {selectedIds.length} contact{selectedIds.length !== 1 ? 's' : ''}? 
              This action cannot be undone and will remove all associated data including deals, tasks, and activity history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteContactsMutation.isPending}
            >
              {deleteContactsMutation.isPending ? 'Deleting...' : 'Delete Contacts'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
