import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings as SettingsIcon, Mail, Users, Tag, Download } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export function Settings() {
  const { toast } = useToast();

  const { data: company } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const result = await backend.company.listCompanies();
        return result.companies[0]; // Get first company (demo company)
      } catch (error) {
        console.error('Failed to fetch company:', error);
        return null;
      }
    },
  });

  const { data: stages } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      try {
        return await backend.stages.listStages({});
      } catch (error) {
        console.error('Failed to fetch stages:', error);
        return { stages: [] };
      }
    },
  });

  const { data: tags } = useQuery({
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

  const handleExportContacts = async () => {
    try {
      const people = await backend.people.listPeople({ limit: 10000 });
      
      // Create CSV content
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Company', 'Tags'];
      const csvContent = [
        headers.join(','),
        ...people.people.map(person => [
          person.firstName || '',
          person.lastName || '',
          person.email || '',
          person.phone || '',
          person.jobTitle || '',
          person.company?.name || '',
          person.tags.map(tag => tag.name).join(';')
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Contacts exported successfully!",
      });
    } catch (error) {
      console.error('Failed to export contacts:', error);
      toast({
        title: "Error",
        description: "Failed to export contacts. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your CRM configuration and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input 
                    id="company-name" 
                    value={company?.name || ''} 
                    disabled 
                  />
                </div>
                <div>
                  <Label htmlFor="company-website">Website</Label>
                  <Input 
                    id="company-website" 
                    value={company?.website || ''} 
                    disabled 
                  />
                </div>
                <div>
                  <Label htmlFor="company-phone">Phone</Label>
                  <Input 
                    id="company-phone" 
                    value={company?.phone || ''} 
                    disabled 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                BCC Email Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bcc-email">Your BCC Email Address</Label>
                <Input 
                  id="bcc-email" 
                  value={company?.bccEmail || ''} 
                  disabled 
                  className="font-mono"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Add this email address as BCC in your email client to automatically log emails to contact timelines.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Copy the BCC email address above</li>
                  <li>In your email client (Gmail, Outlook, etc.), compose a new email</li>
                  <li>Add the BCC email address to the BCC field</li>
                  <li>Send your email - it will automatically appear in the contact's timeline</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Pipeline Stages</CardTitle>
              <p className="text-gray-600">
                Manage your sales pipeline stages. Deals move through these stages from left to right.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stages?.stages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {stage.position}
                      </div>
                      <div>
                        <h4 className="font-medium">{stage.name}</h4>
                        <div className="flex gap-2 mt-1">
                          {stage.isWon && (
                            <Badge variant="default" className="text-xs">Won Stage</Badge>
                          )}
                          {stage.isLost && (
                            <Badge variant="destructive" className="text-xs">Lost Stage</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium mb-1">Note:</p>
                <p>Pipeline stage management is available in the full version. This demo shows the default stages.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Contact Tags
              </CardTitle>
              <p className="text-gray-600">
                Manage tags to categorize and organize your contacts.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tags?.tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium">{tag.name}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium mb-1">Note:</p>
                <p>Tag management features are available in the full version. This demo shows the default tags.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export
              </CardTitle>
              <p className="text-gray-600">
                Export your data for backup or migration purposes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Contacts</h4>
                  <p className="text-sm text-gray-600">
                    Download all your contacts as a CSV file
                  </p>
                </div>
                <Button onClick={handleExportContacts}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Admin User</h4>
                    <p className="text-sm text-gray-600">admin@demo.com</p>
                  </div>
                  <Badge>Admin</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Team Member</h4>
                    <p className="text-sm text-gray-600">member@demo.com</p>
                  </div>
                  <Badge variant="secondary">Member</Badge>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium mb-1">Note:</p>
                <p>Team invitation and user management features are available in the full version.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
