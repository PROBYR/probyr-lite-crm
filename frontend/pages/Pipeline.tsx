import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, AlertCircle, BarChart2 } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { CreateDealDialog } from '@/components/CreateDealDialog';
import { StageColumn } from '@/components/StageColumn';
import { DealCard } from '@/components/DealCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Pipeline() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pipelinesData, isLoading: pipelinesLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => backend.pipelines.list(),
  });

  const { data: pipelineDetails, isLoading: pipelineDetailsLoading } = useQuery({
    queryKey: ['pipeline', selectedPipelineId],
    queryFn: () => backend.pipelines.get({ id: selectedPipelineId }),
    enabled: !!selectedPipelineId,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: number; stageId: number }) => {
      return await backend.deals.updateDealStage({ id: dealId, stageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedPipelineId] });
      toast({ title: "Success", description: "Deal moved successfully!" });
    },
    onError: (error) => {
      console.error('Failed to update deal stage:', error);
      toast({ title: "Error", description: "Failed to move deal.", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedPipelineId] });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const dealId = parseInt(result.draggableId);
    const newStageId = parseInt(result.destination.droppableId);
    updateStageMutation.mutate({ dealId, stageId: newStageId });
  };

  const handleDealCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['pipeline', selectedPipelineId] });
    setShowCreateDialog(false);
    toast({ title: "Success", description: "Deal created successfully!" });
  };

  const isLoading = pipelinesLoading || pipelineDetailsLoading;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          {pipelinesData && (
            <Select value={String(selectedPipelineId)} onValueChange={(v) => setSelectedPipelineId(Number(v))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pipelinesData.pipelines.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {pipelineDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Total Deals</h4>
            <p className="text-2xl font-bold">{pipelineDetails.totalDeals}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Pipeline Value</h4>
            <p className="text-2xl font-bold">${pipelineDetails.totalValue.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Avg. Deal Size</h4>
            <p className="text-2xl font-bold">${pipelineDetails.averageDealValue.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Win Rate</h4>
            <p className="text-2xl font-bold">{pipelineDetails.winRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-96 bg-gray-200 rounded"></div>)}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
            {pipelineDetails?.stages.map((stage) => (
              <StageColumn key={stage.id} stage={stage} dealsCount={stage.deals.length} totalValue={stage.totalValue}>
                {stage.deals.map((deal, index) => (
                  <Draggable key={deal.id} draggableId={deal.id.toString()} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <DealCard deal={deal} />
                      </div>
                    )}
                  </Draggable>
                ))}
              </StageColumn>
            ))}
          </div>
        </DragDropContext>
      )}

      <CreateDealDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onDealCreated={handleDealCreated} />
    </div>
  );
}
