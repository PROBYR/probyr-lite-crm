import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Building, 
  Globe, 
  MapPin, 
  Phone,
  Mail,
  Users,
  Plus,
  Edit,
  Target,
  Activity,
  ExternalLink
} from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CreatePersonDialog } from '@/components/CreatePersonDialog';
import { EditCompanyDialog } from '@/components/EditCompanyDialog';

export function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const { data: company, isLoading, refetch: refetchCompany } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) throw new Error('No company ID provided');
      try {
        return await backend.company.getCompany({ id: parseInt(id) });
      } catch (error) {
        console.error('Failed to fetch company:', error);
        toast({
          title: "Error",
          description: "Failed to load company. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!id,
  });

  const { data: contacts, refetch: refetchContacts } = useQuery({
    queryKey: ['people', 'company', id],
    queryFn: async () => {
      if (!id) return { people: [], total: 0 };
      // Use the existing listPeople endpoint but we'll filter by company on the frontend
      // In a real implementation, you'd add a companyId filter to the backend
      const allPeople = await backend.people.listPeople({ limit: 1000 });
      const companyContacts = allPeople.people.filter(person => person.companyId === parseInt(id));
      return { people: companyContacts, total: companyContacts.length };
    },
    enabled: !!id,
  });

  const { data: deals, refetch: refetchDeals } = useQuery({
    queryKey: ['deals', 'company', id],
    queryFn: async () => {
      if (!id) return { deals: [], total: 0 };
      // Get all deals and filter by people associated with this company
      const allDeals = await backend.deals.listDeals({ limit: 1000 });
      const companyDeals = allDeals.deals.filter(deal => 
        deal.person && contacts?.people.some(contact => contact.id === deal.person?.id)
      );
      return { deals: companyDeals, total: companyDeals.length };
    },
    enabled: !!id && !!contacts,
  });

  const handleContactCreated = () => {
    refetchContacts();
    setShowCreateContactDialog(false);
    toast({
      title: "Success",
      description: "Contact added to company successfully!",
    });
  };

  const handleCompanyUpdated = () => {
    refetchCompany();
    setShowEditDialog(false);
    toast({
      title: "Success",
      description: "Company updated successfully!",
    });
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div></div>;
  }

  if (!company) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">Company not found</h3>
        <Link to="/companies"><Button className="mt-4">Back to Companies</Button></Link>
      </div>
    );
  }

  const totalDealsValue = deals?.deals.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
  const activeDeals = deals?.deals.filter(deal => !deal.stage.isWon && !deal.stage.isLost).length || 0;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <Link to="/companies">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-6 h-6" />
              {company.name}
            </h1>
            {company.industry && <p className="text-gray-600">{company.industry}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowCreateContactDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Contact
          </Button>
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="w-4 h-4 mr-2" />Edit Company
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {contacts?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeDeals}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalDealsValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="contacts">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Contacts ({contacts?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="deals" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Deals ({deals?.total || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="contacts" className="mt-6">
              {contacts && contacts.people.length > 0 ? (
                <div className="space-y-4">
                  {contacts.people.map((contact) => (
                    <Card key={contact.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link 
                              to={`/contacts/${contact.id}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {contact.firstName} {contact.lastName}
                            </Link>
                            {contact.jobTitle && (
                              <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                            )}
                            {contact.email && (
                              <p className="text-sm text-gray-500">{contact.email}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{contact.status}</Badge>
                            {contact.lastContactedAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Last contacted: {formatDate(contact.lastContactedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        {contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contact.tags.map((tag) => (
                              <Badge 
                                key={tag.id} 
                                variant="secondary" 
                                className="text-xs"
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
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No contacts yet</p>
                  <p className="text-sm mt-1">Add contacts to this company to get started</p>
                </div>
              )}
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
                            <p className="text-sm text-gray-600">Stage: {deal.stage.name}</p>
                            {deal.person && (
                              <p className="text-sm text-gray-500">
                                Contact: {deal.person.firstName} {deal.person.lastName}
                              </p>
                            )}
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
                  <p className="text-sm mt-1">Deals associated with company contacts will appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {company.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">{company.phone}</a>
                </div>
              )}
              {company.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span className="text-sm">{company.address}</span>
                </div>
              )}
              {company.bccEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">BCC Email:</span>
                    <p className="text-xs text-gray-500 mt-1">{company.bccEmail}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Forward emails to this address to automatically log them
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Created: {formatDate(company.createdAt)}
                </p>
                <p className="text-xs text-gray-500">
                  Updated: {formatDate(company.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreatePersonDialog
        open={showCreateContactDialog}
        onOpenChange={setShowCreateContactDialog}
        onPersonCreated={handleContactCreated}
        defaultCompanyId={company.id}
      />

      {company && (
        <EditCompanyDialog
          company={company}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onCompanyUpdated={handleCompanyUpdated}
        />
      )}
    </div>
  );
}
