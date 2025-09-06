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
  Video
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

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
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
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowEmailDialog(true)}><Send className="w-4 h-4 mr-2" />Send Email</Button>
          <Button variant="outline" onClick={() => setShowMeetingDialog(true)}><Video className="w-4 h-4 mr-2" />Book Meeting</Button>
          <Button variant="outline" onClick={() => setShowTaskDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Task</Button>
          <Button variant="outline" onClick={() => setShowDealDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Deal</Button>
          <Button onClick={() => setShowEditDialog(true)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="deals">Deals ({deals?.deals.length || 0})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks?.tasks.length || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-6">
              <ActivityTimeline activities={activities?.activities || []} />
            </TabsContent>
            {/* Other tabs content here */}
          </Tabs>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {person.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-500" /><a href={`mailto:${person.email}`} className="text-blue-600 hover:underline">{person.email}</a></div>}
              {person.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-500" /><a href={`tel:${person.phone}`} className="text-blue-600 hover:underline">{person.phone}</a></div>}
              {person.company && <div className="flex items-center gap-3"><Building className="w-4 h-4 text-gray-500" /><span>{person.company.name}</span></div>}
              <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-500" /><span className="text-sm">Last contacted: {formatDate(person.lastContactedAt)}</span></div>
            </CardContent>
          </Card>
          {person.tags.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TagIcon className="w-4 h-4" />Tags</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {person.tags.map((tag) => <Badge key={tag.id} variant="secondary" style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}>{tag.name}</Badge>)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {person && <EditPersonDialog person={person} open={showEditDialog} onOpenChange={setShowEditDialog} onPersonUpdated={handlePersonUpdated} />}
      <CreateTaskDialog open={showTaskDialog} onOpenChange={setShowTaskDialog} onTaskCreated={handleTaskCreated} defaultPersonId={person.id} />
      <CreateDealDialog open={showDealDialog} onOpenChange={setShowDealDialog} onDealCreated={handleDealCreated} defaultPersonId={person.id} />
      {person.email && <SendEmailDialog open={showEmailDialog} onOpenChange={setShowEmailDialog} onEmailSent={handleEmailSent} personId={person.id} personEmail={person.email} />}
      <BookMeetingDialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog} onMeetingBooked={handleMeetingBooked} personId={person.id} />
    </div>
  );
}
