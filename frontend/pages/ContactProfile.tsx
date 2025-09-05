import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Edit,
  Plus,
  Tag as TagIcon,
  Activity
} from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { EditPersonDialog } from '@/components/EditPersonDialog';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { CreateDealDialog } from '@/components/CreateDealDialog';
import { ActivityTimeline } from '@/components/ActivityTimeline';

export function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: person, isLoading, refetch } = useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      if (!id) throw new Error('No person ID provided');
      try {
        return await backend.people.getPerson({ id: parseInt(id) });
      } catch (error) {
        console.error('Failed to fetch person:', error);
        toast({
          title: "Error",
          description: "Failed to load contact. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!id,
  });

  const { data: deals } = useQuery({
    queryKey: ['deals', 'person', id],
    queryFn: async () => {
      if (!id) return { deals: [], total: 0 };
      try {
        return await backend.deals.listDeals({ personId: parseInt(id) });
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        return { deals: [], total: 0 };
      }
    },
    enabled: !!id,
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'person', id],
    queryFn: async () => {
      if (!id) return { tasks: [], total: 0 };
      try {
        return await backend.tasks.listTasks({ personId: parseInt(id) });
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return { tasks: [], total: 0 };
      }
    },
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ['activities', 'person', id],
    queryFn: async () => {
      if (!id) return { activities: [], total: 0 };
      try {
        return await backend.activities.listActivities({ personId: parseInt(id) });
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        return { activities: [], total: 0 };
      }
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('No person ID provided');
      return await backend.people.deletePerson({ id: parseInt(id) });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
    onError: (error) => {
      console.error('Failed to delete person:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePersonUpdated = () => {
    refetch();
    setShowEditDialog(false);
    toast({
      title: "Success",
      description: "Contact updated successfully!",
    });
  };

  const handleTaskCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setShowTaskDialog(false);
    toast({
      title: "Success",
      description: "Task created successfully!",
    });
  };

  const handleDealCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    setShowDealDialog(false);
    toast({
      title: "Success",
      description: "Deal created successfully!",
    });
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Contact not found</h3>
          <p className="text-gray-600 mb-4">The contact you're looking for doesn't exist.</p>
          <Link to="/contacts">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contacts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <Link to="/contacts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {person.firstName} {person.lastName}
            </h1>
            {person.jobTitle && (
              <p className="text-gray-600">{person.jobTitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTaskDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button variant="outline" onClick={() => setShowDealDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deals">Deals ({deals?.deals.length || 0})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks?.tasks.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline activities={activities?.activities || []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deals" className="space-y-4">
              {deals?.deals.map((deal) => (
                <Card key={deal.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{deal.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Stage: {deal.stage.name}</span>
                      {deal.value && (
                        <span>Value: ${deal.value.toLocaleString()}</span>
                      )}
                      {deal.expectedCloseDate && (
                        <span>Expected Close: {formatDate(deal.expectedCloseDate)}</span>
                      )}
                    </div>
                  </CardHeader>
                  {deal.notes && (
                    <CardContent>
                      <p className="text-gray-600">{deal.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {deals?.deals.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600 mb-4">No deals found for this contact.</p>
                    <Button onClick={() => setShowDealDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Deal
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              {tasks?.tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {task.dueDate && (
                            <span>Due: {formatDate(task.dueDate)}</span>
                          )}
                          {task.assignee && (
                            <span>Assigned to: {task.assignee.firstName} {task.assignee.lastName}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant={task.isCompleted ? "default" : "secondary"}>
                        {task.isCompleted ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {tasks?.tasks.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600 mb-4">No tasks found for this contact.</p>
                    <Button onClick={() => setShowTaskDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {person.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline">
                    {person.email}
                  </a>
                </div>
              )}
              
              {person.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline">
                    {person.phone}
                  </a>
                </div>
              )}
              
              {person.company && (
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span>{person.company.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  Last contacted: {formatDate(person.lastContactedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {person.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {person.tags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color 
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EditPersonDialog
        person={person}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onPersonUpdated={handlePersonUpdated}
      />

      <CreateTaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        onTaskCreated={handleTaskCreated}
        defaultPersonId={person.id}
      />

      <CreateDealDialog
        open={showDealDialog}
        onOpenChange={setShowDealDialog}
        onDealCreated={handleDealCreated}
        defaultPersonId={person.id}
      />
    </div>
  );
}
