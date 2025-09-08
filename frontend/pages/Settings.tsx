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
import { ApiKeyManagement } from '@/components/ApiKeyManagement';
import { UserConnectionSettings } from '@/components/UserConnectionSettings';
import { CompanyProfileForm } from '@/components/CompanyProfileForm';
import { UserManagement } from '@/components/UserManagement';
import { EmailSignatureEditor } from '@/components/EmailSignatureEditor';

export function Settings() {
  const { toast } = useToast();

  const { data: stages } = useQuery({
    queryKey: ['stages'],
    queryFn: () => backend.stages.listStages({}),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => backend.tags.listTags({}),
  });

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
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
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
          <ApiKeyManagement />
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
    </div>
  );
}
