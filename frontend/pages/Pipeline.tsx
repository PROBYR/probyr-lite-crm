import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, DollarSign, Calendar, User } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CreateDealDialog } from '../components/CreateDealDialog';

export function Pipeline() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stages, isLoading: stagesLoading } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      try {
        return await backend.stages.listStages({});
      } catch (error) {
        console.error('Failed to fetch stages:', error);
        toast({
          title: "Error",
          description: "Failed to load pipeline stages. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      try {
        return await backend.deals.listDeals({});
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        toast({
          title: "Error",
          description: "Failed to load deals. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: number; stageId: number }) => {
      return await backend.deals.updateDealStage({ id: dealId, stageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Success",
        description: "Deal moved successfully!",
      });
    },
    onError: (error) => {
      console.error('Failed to update deal stage:', error);
      toast({
        title: "Error",
        description: "Failed to move deal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const dealId = parseInt(result.draggableId);
    const newStageId = parseInt(result.destination.droppableId);

    updateStageMutation.mutate({ dealId, stageId: newStageId });
  };

  const handleDealCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    setShowCreateDialog(false);
    toast({
      title: "Success",
      description: "Deal created successfully!",
    });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '';
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

  const getDealsByStage = (stageId: number) => {
    return deals?.deals.filter(deal => deal.stageId === stageId) || [];
  };

  const getTotalValueByStage = (stageId: number) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  if (stagesLoading || dealsLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600 mt-1">
            {deals?.total || 0} active deals
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
          {stages?.stages.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const totalValue = getTotalValueByStage(stage.id);

            return (
              <div key={stage.id} className="min-w-80 lg:min-w-0">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                    <span>{stageDeals.length} deals</span>
                    {totalValue > 0 && (
                      <span className="font-medium">{formatCurrency(totalValue)}</span>
                    )}
                  </div>
                </div>

                <Droppable droppableId={stage.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-32 p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-move transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                              }`}
                            >
                              <CardContent className="p-4">
                                <h4 className="font-medium text-gray-900 mb-2">
                                  {deal.title}
                                </h4>
                                
                                {deal.person && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <User className="w-4 h-4" />
                                    <span>{deal.person.firstName} {deal.person.lastName}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between text-sm">
                                  {deal.value && (
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
                                    {deal.probability}% chance
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <CreateDealDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onDealCreated={handleDealCreated}
      />
    </div>
  );
}
