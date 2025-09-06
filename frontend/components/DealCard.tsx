import React from 'react';
import { DollarSign, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Deal {
  id: number;
  title: string;
  value?: number;
  expectedCloseDate?: Date;
  probability: number;
  person?: {
    id: number;
    firstName: string;
    lastName?: string;
    email?: string;
  };
}

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
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

  return (
    <Card data-testid="deal-card" className="cursor-move transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          {deal.title || 'Untitled Deal'}
        </h4>
        
        {deal.person && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <User className="w-4 h-4" />
            <span>{deal.person.firstName || ''} {deal.person.lastName || ''}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          {typeof deal.value === 'number' && deal.value > 0 && (
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <DollarSign className="w-4 h-4" />
              {formatCurrency(deal.value)}
            </div>
          )}
          
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-4 h-4" />
              {formatDate(deal.expectedCloseDate)}
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {deal.probability || 0}% chance
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
