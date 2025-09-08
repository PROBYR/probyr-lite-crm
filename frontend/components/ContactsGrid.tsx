import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Phone, Mail, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Person } from '~backend/people/list_people';

interface ContactsGridProps {
  people: Person[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function ContactsGrid({ people, selectedIds, onSelectionChange }: ContactsGridProps) {
  const formatLastContacted = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const contacted = new Date(date);
    const diffTime = Math.abs(now.getTime() - contacted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return contacted.toLocaleDateString();
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {people.map((person) => (
        <Card key={person.id} className="hover:shadow-md transition-shadow relative">
          <div className="absolute top-3 right-3 z-10">
            <Checkbox
              checked={selectedIds.includes(person.id)}
              onCheckedChange={(checked) => handleSelectRow(person.id, !!checked)}
              className="bg-white border-2"
            />
          </div>
          
          <Link to={`/contacts/${person.id}`} className="block">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 pr-8">
                <User className="w-5 h-5 text-gray-500" />
                {person.firstName} {person.lastName}
              </CardTitle>
              {person.jobTitle && (
                <p className="text-sm text-gray-600">{person.jobTitle}</p>
              )}
              {person.company && (
                <Link 
                  to={`/companies/${person.company.id}`}
                  className="text-sm text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {person.company.name}
                </Link>
              )}
              {person.owner && (
                <p className="text-xs text-blue-600">
                  Owner: {person.owner.firstName} {person.owner.lastName}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3">
              {person.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{person.email}</span>
                </div>
              )}
              
              {person.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{person.phone}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Last contacted: {formatLastContacted(person.lastContactedAt)}
                </span>
              </div>
              
              {person.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {person.tags.slice(0, 3).map((tag) => (
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
                      <Tag className="w-3 h-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                  {person.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{person.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
