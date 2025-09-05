import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Calendar, 
  User, 
  CheckSquare, 
  Clock,
  AlertCircle
} from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';

export function TasksDashboard() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: todayTasks, isLoading: todayLoading } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      try {
        return await backend.tasks.listTasks({ 
          dueBefore: today,
          isCompleted: false 
        });
      } catch (error) {
        console.error('Failed to fetch today tasks:', error);
        return { tasks: [], total: 0 };
      }
    },
  });

  const { data: overdueTasks, isLoading: overdueLoading } = useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: async () => {
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return await backend.tasks.listTasks({ 
          dueBefore: yesterday,
          isCompleted: false 
        });
      } catch (error) {
        console.error('Failed to fetch overdue tasks:', error);
        return { tasks: [], total: 0 };
      }
    },
  });

  const { data: upcomingTasks, isLoading: upcomingLoading } = useQuery({
    queryKey: ['tasks', 'upcoming'],
    queryFn: async () => {
      try {
        return await backend.tasks.listTasks({ 
          dueAfter: tomorrow,
          isCompleted: false 
        });
      } catch (error) {
        console.error('Failed to fetch upcoming tasks:', error);
        return { tasks: [], total: 0 };
      }
    },
  });

  const { data: allTasks, isLoading: allLoading } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: async () => {
      try {
        return await backend.tasks.listTasks({});
      } catch (error) {
        console.error('Failed to fetch all tasks:', error);
        return { tasks: [], total: 0 };
      }
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      return await backend.tasks.updateTask({ id, isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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

  const handleTaskCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setShowCreateDialog(false);
    toast({
      title: "Success",
      description: "Task created successfully!",
    });
  };

  const handleTaskToggle = (taskId: number, currentCompleted: boolean) => {
    updateTaskMutation.mutate({ id: taskId, isCompleted: !currentCompleted });
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'No due date';
    const taskDate = new Date(date);
    const today = new Date();
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;
    return taskDate.toLocaleDateString();
  };

  const TaskList = ({ tasks, loading }: { tasks: any[], loading: boolean }) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No tasks found
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.isCompleted}
                  onCheckedChange={() => handleTaskToggle(task.id, task.isCompleted)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    )}
                    
                    {task.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                      </div>
                    )}
                    
                    {task.person && (
                      <div className="flex items-center gap-1">
                        <span>Contact: {task.person.firstName} {task.person.lastName}</span>
                      </div>
                    )}
                    
                    {task.deal && (
                      <div className="flex items-center gap-1">
                        <span>Deal: {task.deal.title}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {task.isCompleted && (
                  <Badge variant="default" className="ml-auto">
                    Completed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">
            {allTasks?.total || 0} total tasks
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todayTasks?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueTasks?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {upcomingTasks?.total || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today ({todayTasks?.total || 0})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueTasks?.total || 0})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingTasks?.total || 0})</TabsTrigger>
          <TabsTrigger value="all">All ({allTasks?.total || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <TaskList tasks={todayTasks?.tasks || []} loading={todayLoading} />
        </TabsContent>

        <TabsContent value="overdue">
          <TaskList tasks={overdueTasks?.tasks || []} loading={overdueLoading} />
        </TabsContent>

        <TabsContent value="upcoming">
          <TaskList tasks={upcomingTasks?.tasks || []} loading={upcomingLoading} />
        </TabsContent>

        <TabsContent value="all">
          <TaskList tasks={allTasks?.tasks || []} loading={allLoading} />
        </TabsContent>
      </Tabs>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
