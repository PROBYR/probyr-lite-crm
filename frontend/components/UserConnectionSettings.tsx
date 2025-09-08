import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Calendar, Settings, Link2, CheckCircle, AlertCircle, TestTube } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface UserConnectionSettingsProps {
  userId: number;
}

export function UserConnectionSettings({ userId }: UserConnectionSettingsProps) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    provider: 'gmail' as 'gmail' | 'outlook' | 'smtp',
    emailAddress: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    imapHost: '',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
  });
  const [calendarFormData, setCalendarFormData] = useState({
    provider: 'google' as 'google' | 'outlook' | 'caldav',
    caldavUrl: '',
    caldavUsername: '',
    caldavPassword: '',
    primaryCalendarId: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections, refetch } = useQuery({
    queryKey: ['user-connections', userId],
    queryFn: async () => {
      try {
        return await backend.user_connections.getUserConnections({ userId });
      } catch (error) {
        console.error('Failed to fetch user connections:', error);
        return {};
      }
    },
  });

  const connectEmailMutation = useMutation({
    mutationFn: async (data: typeof emailFormData) => {
      return await backend.user_connections.connectEmail({
        userId,
        provider: data.provider,
        emailAddress: data.emailAddress,
        smtpHost: data.provider === 'smtp' ? data.smtpHost : undefined,
        smtpPort: data.provider === 'smtp' ? data.smtpPort : undefined,
        smtpUsername: data.provider === 'smtp' ? data.smtpUsername : undefined,
        smtpPassword: data.provider === 'smtp' ? data.smtpPassword : undefined,
        imapHost: data.provider === 'smtp' ? data.imapHost : undefined,
        imapPort: data.provider === 'smtp' ? data.imapPort : undefined,
        imapUsername: data.provider === 'smtp' ? data.imapUsername : undefined,
        imapPassword: data.provider === 'smtp' ? data.imapPassword : undefined,
      });
    },
    onSuccess: () => {
      refetch();
      setShowEmailDialog(false);
      toast({
        title: "Success",
        description: "Email account connected successfully!",
      });
    },
    onError: (error) => {
      console.error('Failed to connect email:', error);
      toast({
        title: "Error",
        description: "Failed to connect email account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const connectCalendarMutation = useMutation({
    mutationFn: async (data: typeof calendarFormData) => {
      return await backend.user_connections.connectCalendar({
        userId,
        provider: data.provider,
        caldavUrl: data.provider === 'caldav' ? data.caldavUrl : undefined,
        caldavUsername: data.provider === 'caldav' ? data.caldavUsername : undefined,
        caldavPassword: data.provider === 'caldav' ? data.caldavPassword : undefined,
        primaryCalendarId: data.primaryCalendarId || undefined,
      });
    },
    onSuccess: () => {
      refetch();
      setShowCalendarDialog(false);
      toast({
        title: "Success",
        description: "Calendar connected successfully!",
      });
    },
    onError: (error) => {
      console.error('Failed to connect calendar:', error);
      toast({
        title: "Error",
        description: "Failed to connect calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testEmailConnectionMutation = useMutation({
    mutationFn: async () => {
      return await backend.outreach.testEmailConnection({ userId });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Failed to test email connection:', error);
      toast({
        title: "Error",
        description: "Failed to test email connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = () => {
    if (!emailFormData.emailAddress) {
      toast({
        title: "Error",
        description: "Email address is required.",
        variant: "destructive",
      });
      return;
    }
    connectEmailMutation.mutate(emailFormData);
  };

  const handleCalendarSubmit = () => {
    connectCalendarMutation.mutate(calendarFormData);
  };

  const handleTestConnection = () => {
    testEmailConnectionMutation.mutate();
  };

  const simulateOAuth = (provider: string) => {
    toast({
      title: "OAuth Integration",
      description: `In a real implementation, this would redirect to ${provider} OAuth flow.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Personal Connections
        </CardTitle>
        <p className="text-gray-600">
          Connect your personal email and calendar accounts to send emails and book meetings directly from the CRM.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Connection */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            <div>
              <h4 className="font-medium">Email Account</h4>
              {connections?.email ? (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Connected
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {connections.email.emailAddress}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({connections.email.provider})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not Connected
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Connect to send emails from CRM
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {connections?.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testEmailConnectionMutation.isPending}
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testEmailConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
            )}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Link2 className="w-4 h-4 mr-2" />
                  {connections?.email ? 'Reconnect' : 'Connect'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Connect Email Account</DialogTitle>
                  <DialogDescription>
                    Choose your email provider and connect your account.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="oauth" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="oauth">OAuth (Recommended)</TabsTrigger>
                    <TabsTrigger value="manual">Manual Setup</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="oauth" className="space-y-4">
                    <div className="space-y-3">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => simulateOAuth('Google')}
                      >
                        Connect Gmail
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => simulateOAuth('Microsoft')}
                      >
                        Connect Outlook
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Secure one-click setup with OAuth 2.0
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div>
                      <Label htmlFor="email-address">Email Address *</Label>
                      <Input
                        id="email-address"
                        type="email"
                        value={emailFormData.emailAddress}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, emailAddress: e.target.value }))}
                        placeholder="your.email@company.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-host">SMTP Host</Label>
                        <Input
                          id="smtp-host"
                          value={emailFormData.smtpHost}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, smtpHost: e.target.value }))}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          value={emailFormData.smtpPort}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-username">Username</Label>
                        <Input
                          id="smtp-username"
                          value={emailFormData.smtpUsername}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, smtpUsername: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-password">Password</Label>
                        <Input
                          id="smtp-password"
                          type="password"
                          value={emailFormData.smtpPassword}
                          onChange={(e) => setEmailFormData(prev => ({ ...prev, smtpPassword: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEmailSubmit} disabled={connectEmailMutation.isPending}>
                        {connectEmailMutation.isPending ? 'Connecting...' : 'Connect Email'}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar Connection */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-medium">Calendar</h4>
              {connections?.calendar ? (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Connected
                  </Badge>
                  <span className="text-xs text-gray-500">
                    ({connections.calendar.provider})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not Connected
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Connect to book meetings from CRM
                  </span>
                </div>
              )}
            </div>
          </div>
          <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link2 className="w-4 h-4 mr-2" />
                {connections?.calendar ? 'Reconnect' : 'Connect'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Calendar</DialogTitle>
                <DialogDescription>
                  Choose your calendar provider and connect your account.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="oauth" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="oauth">OAuth (Recommended)</TabsTrigger>
                  <TabsTrigger value="manual">Manual Setup</TabsTrigger>
                </TabsList>
                
                <TabsContent value="oauth" className="space-y-4">
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => simulateOAuth('Google Calendar')}
                    >
                      Connect Google Calendar
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => simulateOAuth('Outlook Calendar')}
                    >
                      Connect Outlook Calendar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Secure one-click setup with OAuth 2.0
                  </p>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <Label htmlFor="caldav-url">CalDAV URL</Label>
                    <Input
                      id="caldav-url"
                      value={calendarFormData.caldavUrl}
                      onChange={(e) => setCalendarFormData(prev => ({ ...prev, caldavUrl: e.target.value }))}
                      placeholder="https://calendar.example.com/caldav"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="caldav-username">Username</Label>
                      <Input
                        id="caldav-username"
                        value={calendarFormData.caldavUsername}
                        onChange={(e) => setCalendarFormData(prev => ({ ...prev, caldavUsername: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="caldav-password">Password</Label>
                      <Input
                        id="caldav-password"
                        type="password"
                        value={calendarFormData.caldavPassword}
                        onChange={(e) => setCalendarFormData(prev => ({ ...prev, caldavPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCalendarDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCalendarSubmit} disabled={connectCalendarMutation.isPending}>
                      {connectCalendarMutation.isPending ? 'Connecting...' : 'Connect Calendar'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
