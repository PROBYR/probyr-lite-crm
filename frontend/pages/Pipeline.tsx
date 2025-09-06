import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, DollarSign, Calendar, User, AlertCircle } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { CreateDealDialog } from '@/components/CreateDealDialog';

export function Pipeline() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stages, isLoading: stagesLoading } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      try {
        const result = await backend.stages.listStages({});
        return result;
      } catch (error) {
        console.error('Failed to fetch stages:', error);
        setErrorMessage('Failed to load pipeline stages. Please try again.');
        return { stages: [] };
      }
    },
  });

  const { data: deals, isLoading: dealsLoading, refetch: refetchDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      try {
        const result = await backend.deals.listDeals({});
        setErrorMessage(null); // Clear any previous error
        return result;
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        setErrorMessage('Failed to load deals. Please try again.');
        return { deals: [], total: 0 };
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
      refetchDeals();
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

  // Defensive array access - always use safe defaults
  const safeStages = (stages?.stages ?? []).filter(s => s && s.id);
  const safeDeals = (deals?.deals ?? []).filter(d => d && d.id);

  const getDealsByStage = (stageId: number) => {
    return safeDeals.filter(deal => deal.stageId === stageId);
  };

  const getTotalValueByStage = (stageId: number) => {
    return getDealsByStage(stageId).reduce((sum, deal) => {
      const value = typeof deal.value === 'number' ? deal.value : 0;
      return sum + value;
    }, 0);
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

      {errorMessage && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
            <Button 
              variant="link" 
              className="p-0 ml-2 h-auto" 
              onClick={() => {
                setErrorMessage(null);
                refetchDeals();
              }}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
          {safeStages.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const totalValue = getTotalValueByStage(stage.id);

            return (
              <div key={stage.id} className="min-w-80 lg:min-w-0">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900">{stage.name || 'Unnamed Stage'}</h3>
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
