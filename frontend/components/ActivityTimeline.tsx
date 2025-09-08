import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Mail, 
  Phone, 
  MessageSquare, 
  User, 
  FileText, 
  Plus,
  ExternalLink,
  Eye,
  CheckSquare,
  UserPlus,
  ArrowRight,
  Send,
  MousePointer
} from 'lucide-react';
import backend from '~backend/client';
import type { Activity } from '~backend/activities/list_activities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface ActivityTimelineProps {
  activities: Activity[];
  personId: number;
  onRefresh: () => void;
}

export function ActivityTimeline({ activities, personId, onRefresh }: ActivityTimelineProps) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async (description: string) => {
      return await backend.activities.createActivity({
        companyId: 1, // Demo company
        userId: 1, // Demo user
        personId,
        activityType: 'note',
        title: 'Manual Note Added',
        description,
      });
    },
    onSuccess: () => {
      onRefresh();
      setShowAddNote(false);
      setNoteText('');
      toast({
        title: "Success",
        description: "Note added successfully!",
      });
    },
    onError: (error) => {
      console.error('Failed to add note:', error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'email_open':
        return <Eye className="w-4 h-4" />;
      case 'link_click':
        return <MousePointer className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'note':
        return <MessageSquare className="w-4 h-4" />;
      case 'task_created':
        return <Plus className="w-4 h-4" />;
      case 'task_completed':
        return <CheckSquare className="w-4 h-4" />;
      case 'contact_created':
        return <UserPlus className="w-4 h-4" />;
      case 'contact_assigned':
        return <User className="w-4 h-4" />;
      case 'deal_created':
      case 'deal_moved':
        return <ArrowRight className="w-4 h-4" />;
      case 'form_submission':
        return <FileText className="w-4 h-4" />;
      case 'api_import':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'text-blue-600 bg-blue-100';
      case 'email_open':
        return 'text-green-600 bg-green-100';
      case 'link_click':
        return 'text-purple-600 bg-purple-100';
      case 'call':
        return 'text-green-600 bg-green-100';
      case 'meeting':
        return 'text-purple-600 bg-purple-100';
      case 'note':
        return 'text-gray-600 bg-gray-100';
      case 'task_created':
      case 'task_completed':
        return 'text-orange-600 bg-orange-100';
      case 'contact_created':
      case 'contact_assigned':
        return 'text-indigo-600 bg-indigo-100';
      case 'deal_created':
      case 'deal_moved':
        return 'text-emerald-600 bg-emerald-100';
      case 'form_submission':
      case 'api_import':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffTime = now.getTime() - activityDate.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return activityDate.toLocaleDateString();
  };

  const handleAddNote = () => {
    if (!noteText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note.",
        variant: "destructive",
      });
      return;
    }
    createNoteMutation.mutate(noteText);
  };

  return (
    <div className="space-y-4">
      {/* Add Note Section */}
      <Card>
        <CardContent className="p-4">
          {!showAddNote ? (
            <Button 
              variant="outline" 
              onClick={() => setShowAddNote(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add a Note
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Add a note about this contact (e.g., phone call summary, meeting notes, etc.)"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddNote}
                  disabled={createNoteMutation.isPending}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddNote(false);
                    setNoteText('');
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No activity recorded yet</p>
          <p className="text-sm mt-1">Activity will appear here as you interact with this contact</p>
        </div>
      ) : (
        activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.activityType)}`}>
                {getActivityIcon(activity.activityType)}
              </div>
              {index < activities.length - 1 && (
                <div className="w-px h-6 bg-gray-200 mx-auto mt-2" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 pb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                  
                  {activity.description && (
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  )}
                  
                  {activity.emailSubject && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-700">Subject: {activity.emailSubject}</p>
                      {activity.emailBody && (
                        <div className="text-gray-600 mt-1 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ __html: activity.emailBody.replace(/\n/g, '<br>') }} />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.activityType.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {activity.user && (
                        <span className="text-xs text-gray-500">
                          by {activity.user.firstName} {activity.user.lastName}
                        </span>
                      )}
                    </div>
                    
                    {activity.deal && (
                      <span className="text-xs text-gray-500">
                        Related to: {activity.deal.title}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
