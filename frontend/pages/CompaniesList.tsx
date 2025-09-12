import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Building, ExternalLink, Users, MapPin, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { CreateCompanyDialog } from '@/components/CreateCompanyDialog';

export function CompaniesList() {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['companies', search],
    queryFn: async () => {
      try {
        return await backend.company.listCompanies();
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again.",
          variant: "destructive",
        });
        return { companies: [] };
      }
    },
  });

  const handleCompanyCreated = () => {
    refetch();
    setShowCreateDialog(false);
    toast({
      title: "Success",
      description: "Company created successfully!",
    });
  };

  const companies = data?.companies || [];
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(search.toLowerCase()) ||
    (company.website && company.website.toLowerCase().includes(search.toLowerCase())) ||
    (company.industry && company.industry.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">
            {filteredCompanies.length} of {companies.length} companies
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="mt-4 lg:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <Link to={`/companies/${company.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="w-5 h-5 text-gray-500" />
                    {company.name}
                  </CardTitle>
                  {company.industry && (
                    <p className="text-sm text-gray-600">{company.industry}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {company.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span className="truncate">{company.website}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </div>
                  )}
                  
                  {company.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{company.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>View contacts</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Created {new Date(company.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {search ? 'No companies found' : 'No companies yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {search 
              ? 'Try adjusting your search terms.'
              : 'Get started by adding your first company.'
            }
          </p>
          {!search && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          )}
        </div>
      )}

      <CreateCompanyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  );
}
