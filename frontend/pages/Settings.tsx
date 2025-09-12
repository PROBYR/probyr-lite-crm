import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Mail, Users, Tag, Download, Plus, Trash, Edit, BarChart3, Key, User } from 'lucide-react';
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
import { ApiKeyManagementAdvanced } from '@/components/ApiKeyManagementAdvanced';
import { UserConnectionSettings } from '@/components/UserConnectionSettings';
import { CompanyProfileForm } from '@/components/CompanyProfileForm';
import { UserManagement } from '@/components/UserManagement';
import { EmailSignatureEditor } from '@/components/EmailSignatureEditor';
import { CreatePipelineDialog } from '@/components/CreatePipelineDialog';
import { EditPipelineDialog } from '@/components/EditPipelineDialog';

export function Settings() {
  const [showCreatePipelineDialog, setShowCreatePipelineDialog] = useState(false);
  const [showEditPipelineDialog, setShowEditPipelineDialog] = useState(false);
  const [editingPipelineId, setEditingPipelineId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pipelines, refetch: refetchPipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => backend.pipelines.list(),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => backend.tags.listTags({}),
  });

  const deletePipelineMutation = useMutation({
    mutationFn: async (id: number) => {
      return await backend.pipelines.deletePipeline({ id });
    },
    onSuccess: () => {
      refetchPipelines();
      toast({
        title: "Success",
        description: "Pipeline deleted successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete pipeline:', error);
      const errorMessage = error?.message || "Failed to delete pipeline. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handlePipelineCreated = () => {
    refetchPipelines();
    setShowCreatePipelineDialog(false);
    toast({
      title: "Success",
      description: "Pipeline created successfully!",
    });
  };

  const handlePipelineUpdated = () => {
    refetchPipelines();
    queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    setShowEditPipelineDialog(false);
    setEditingPipelineId(null);
    toast({
      title: "Success",
      description: "Pipeline updated successfully!",
    });
  };

  const handleEditPipeline = (id: number) => {
    setEditingPipelineId(id);
    setShowEditPipelineDialog(true);
  };

  const handleDeletePipeline = (id: number) => {
    deletePipelineMutation.mutate(id);
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

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="pipeline">Pipelines</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <CompanyProfileForm />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <EmailSignatureEditor userId={1} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <UserConnectionSettings userId={1} />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <ApiKeyManagementAdvanced />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Sales Pipelines
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Manage your sales pipelines and their stages. Each pipeline represents a different sales process.
                  </p>
                </div>
                <Button onClick={() => setShowCreatePipelineDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pipeline
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pipelines?.pipelines.length ? (
                <div className="space-y-4">
                  {pipelines.pipelines.map((pipeline) => (
                    <div key={pipeline.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{pipeline.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{pipeline.stageCount} stages</span>
                          <span>{pipeline.dealCount} deals</span>
                          <span>Created {new Date(pipeline.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPipeline(pipeline.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Pipeline</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this pipeline? This action cannot be undone.
                                {pipeline.dealCount > 0 && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                                    This pipeline contains {pipeline.dealCount} active deals. Please move or delete the deals first.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePipeline(pipeline.id)}
                                disabled={pipeline.dealCount > 0 || deletePipelineMutation.isPending}
                              >
                                {deletePipelineMutation.isPending ? 'Deleting...' : 'Delete Pipeline'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No pipelines created yet</p>
                  <p className="text-sm mt-1">Create your first sales pipeline to get started</p>
                </div>
              )}
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

      <CreatePipelineDialog
        open={showCreatePipelineDialog}
        onOpenChange={setShowCreatePipelineDialog}
        onPipelineCreated={handlePipelineCreated}
      />

      <EditPipelineDialog
        pipelineId={editingPipelineId}
        open={showEditPipelineDialog}
        onOpenChange={setShowEditPipelineDialog}
        onPipelineUpdated={handlePipelineUpdated}
      />
    </div>
  );
}
