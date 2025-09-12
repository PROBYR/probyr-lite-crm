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
  Activity,
  Briefcase,
  Send,
  Video,
  CheckSquare,
  Target
} from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { EditPersonDialog } from '@/components/EditPersonDialog';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { CreateDealDialog } from '@/components/CreateDealDialog';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { SendEmailDialog } from '@/components/SendEmailDialog';
import { BookMeetingDialog } from '@/components/BookMeetingDialog';

export function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: person, isLoading, refetch: refetchPerson } = useQuery({
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

  const { data: deals, refetch: refetchDeals } = useQuery({
    queryKey: ['deals', 'person', id],
    queryFn: async () => {
      if (!id) return { deals: [], total: 0 };
      return await backend.deals.listDeals({ personId: parseInt(id) });
    },
    enabled: !!id,
  });

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', 'person', id],
    queryFn: async () => {
      if (!id) return { tasks: [], total: 0 };
      return await backend.tasks.listTasks({ personId: parseInt(id) });
    },
    enabled: !!id,
  });

  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ['activities', 'person', id],
    queryFn: async () => {
      if (!id) return { activities: [], total: 0 };
      return await backend.activities.listActivities({ personId: parseInt(id) });
    },
    enabled: !!id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: number; isCompleted: boolean }) => {
      return await backend.tasks.updateTask({ id: taskId, isCompleted });
    },
    onSuccess: () => {
      refetchTasks();
      refetchActivities();
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePersonUpdated = () => {
    refetchPerson();
    setShowEditDialog(false);
    toast({ title: "Success", description: "Contact updated successfully!" });
  };

  const handleTaskCreated = () => {
    refetchTasks();
    refetchActivities();
    setShowTaskDialog(false);
    toast({ title: "Success", description: "Task created successfully!" });
  };

  const handleDealCreated = () => {
    refetchDeals();
    refetchActivities();
    setShowDealDialog(false);
    toast({ title: "Success", description: "Deal created successfully!" });
  };

  const handleEmailSent = () => {
    refetchActivities();
    setShowEmailDialog(false);
    toast({ title: "Success", description: "Email sent and logged successfully!" });
  };

  const handleMeetingBooked = () => {
    refetchActivities();
    setShowMeetingDialog(false);
    toast({ title: "Success", description: "Meeting booked and logged successfully!" });
  };

  const handleTaskToggle = (taskId: number, currentCompleted: boolean) => {
    updateTaskMutation.mutate({ taskId, isCompleted: !currentCompleted });
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New Lead':
        return <Badge variant="outline">{status}</Badge>;
      case 'Contacted':
        return <Badge variant="secondary">{status}</Badge>;
      case 'Reply Received':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">{status}</Badge>;
      case 'Closed':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div></div>;
  }

  if (!person) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">Contact not found</h3>
        <Link to="/contacts"><Button className="mt-4">Back to Contacts</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <Link to="/contacts">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{person.firstName} {person.lastName}</h1>
            {person.jobTitle && <p className="text-gray-600 flex items-center gap-2"><Briefcase className="w-4 h-4" />{person.jobTitle}</p>}
            <div className="mt-1">
              {getStatusBadge(person.status)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {person.email && (
            <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Send className="w-4 h-4 mr-2" />Send Email
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowMeetingDialog(true)}>
            <Video className="w-4 h-4 mr-2" />Book Meeting
          </Button>
          <Button variant="outline" onClick={() => setShowTaskDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Task
          </Button>
          <Button variant="outline" onClick={() => setShowDealDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Deal
          </Button>
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="w-4 h-4 mr-2" />Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="deals" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Deals ({deals?.deals.length || 0})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Tasks ({tasks?.tasks.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="mt-6">
              <ActivityTimeline 
                activities={activities?.activities || []} 
                personId={person.id}
                onRefresh={refetchActivities}
              />
            </TabsContent>
            
            <TabsContent value="deals" className="mt-6">
              {deals && deals.deals.length > 0 ? (
                <div className="space-y-4">
                  {deals.deals.map((deal) => (
                    <Card key={deal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{deal.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">Stage: {deal.stage.name}</p>
                            {deal.expectedCloseDate && (
                              <p className="text-sm text-gray-500">
                                Expected close: {formatDate(deal.expectedCloseDate)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {deal.value && deal.value > 0 && (
                              <p className="font-medium text-green-600">{formatCurrency(deal.value)}</p>
                            )}
                            <p className="text-sm text-gray-500">{deal.probability}% chance</p>
                          </div>
                        </div>
                        {deal.notes && (
                          <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">{deal.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No deals yet</p>
                  <p className="text-sm mt-1">Create a deal to track this contact's sales progress</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tasks" className="mt-6">
              {tasks && tasks.tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.isCompleted}
                            onCheckedChange={() => handleTaskToggle(task.id, task.isCompleted)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </h4>
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
                          {task.isCompleted && (
                            <Badge variant="default">Completed</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No tasks yet</p>
                  <p className="text-sm mt-1">Create tasks to keep track of follow-ups and action items</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {person.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline">{person.email}</a>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline">{person.phone}</a>
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
                <span className="text-sm">Last contacted: {formatDate(person.lastContactedAt)}</span>
              </div>
            </CardContent>
          </Card>
          
          {person.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {person && (
        <EditPersonDialog 
          person={person} 
          open={showEditDialog} 
          onOpenChange={setShowEditDialog} 
          onPersonUpdated={handlePersonUpdated} 
        />
      )}
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
      {person.email && (
        <SendEmailDialog 
          open={showEmailDialog} 
          onOpenChange={setShowEmailDialog} 
          onEmailSent={handleEmailSent} 
          personId={person.id} 
          personEmail={person.email} 
        />
      )}
      <BookMeetingDialog 
        open={showMeetingDialog} 
        onOpenChange={setShowMeetingDialog} 
        onMeetingBooked={handleMeetingBooked} 
        personId={person.id} 
      />
    </div>
  );
}
