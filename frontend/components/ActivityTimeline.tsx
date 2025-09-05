import React from 'react';
import { Calendar, Mail, Phone, MessageSquare, User, FileText } from 'lucide-react';
import type { Activity } from '~backend/activities/list_activities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'note':
        return <MessageSquare className="w-4 h-4" />;
      case 'form_submission':
        return <FileText className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'text-blue-600 bg-blue-100';
      case 'call':
        return 'text-green-600 bg-green-100';
      case 'meeting':
        return 'text-purple-600 bg-purple-100';
      case 'note':
        return 'text-gray-600 bg-gray-100';
      case 'form_submission':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffTime = now.getTime() - activityDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays < 7) return `${diffDays - 1} days ago`;
    return activityDate.toLocaleDateString();
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No activity recorded yet</p>
        <p className="text-sm mt-1">Activity will appear here as you interact with this contact</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-4">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.activityType)}`}>
              {getActivityIcon(activity.activityType)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-px h-full bg-gray-200 mx-auto mt-2" />
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
                      <p className="text-gray-600 mt-1 line-clamp-3">{activity.emailBody}</p>
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
      ))}
    </div>
  );
}
