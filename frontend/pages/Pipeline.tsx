import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, AlertCircle, BarChart2, LayoutGrid, List } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { CreateDealDialog } from '@/components/CreateDealDialog';
import { StageColumn } from '@/components/StageColumn';
import { DealCard } from '@/components/DealCard';
import { DealsTableView } from '@/components/DealsTableView';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'table';

export function Pipeline() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tableSortBy, setTableSortBy] = useState('created_at');
  const [tableSortOrder, setTableSortOrder] = useState('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('pipeline-view-mode') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to localStorage
  const setAndSaveViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('pipeline-view-mode', mode);
  };

  const { data: pipelinesData, isLoading: pipelinesLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => backend.pipelines.list(),
  });

  const { data: pipelineDetails, isLoading: pipelineDetailsLoading } = useQuery({
    queryKey: ['pipeline', selectedPipelineId],
    queryFn: () => backend.pipelines.get({ id: selectedPipelineId }),
    enabled: !!selectedPipelineId && viewMode === 'kanban',
  });

  const { data: tableDeals, isLoading: tableDealsLoading } = useQuery({
    queryKey: ['deals-table', selectedPipelineId, tableSortBy, tableSortOrder],
    queryFn: () => backend.deals.listDealsTable({ 
      pipelineId: selectedPipelineId,
      sortBy: tableSortBy,
      sortOrder: tableSortOrder,
      limit: 1000,
    }),
    enabled: !!selectedPipelineId && viewMode === 'table',
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
    queryClient.invalidateQueries({ queryKey: ['deals-table', selectedPipelineId] });
    setShowCreateDialog(false);
    toast({ title: "Success", description: "Deal created successfully!" });
  };

  const handleTableSort = (column: string) => {
    if (tableSortBy === column) {
      setTableSortOrder(tableSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortBy(column);
      setTableSortOrder('asc');
    }
  };

  // Set default pipeline when pipelines load
  useEffect(() => {
    if (pipelinesData?.pipelines.length && selectedPipelineId === 1) {
      const defaultPipeline = pipelinesData.pipelines[0];
      if (defaultPipeline) {
        setSelectedPipelineId(defaultPipeline.id);
      }
    }
  }, [pipelinesData, selectedPipelineId]);

  const isLoading = pipelinesLoading || (viewMode === 'kanban' ? pipelineDetailsLoading : tableDealsLoading);

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          
          {/* Pipeline Selector - only show if multiple pipelines */}
          {pipelinesData && pipelinesData.pipelines.length > 1 && (
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

          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAndSaveViewMode('kanban')}
              className={cn(viewMode === 'kanban' && 'bg-gray-200')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAndSaveViewMode('table')}
              className={cn(viewMode === 'table' && 'bg-gray-200')}
            >
              <List className="w-4 h-4 mr-2" />
              Table
            </Button>
          </div>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Pipeline Stats */}
      {(pipelineDetails || tableDeals) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Total Deals</h4>
            <p className="text-2xl font-bold">
              {viewMode === 'kanban' ? pipelineDetails?.totalDeals : tableDeals?.total}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Pipeline Value</h4>
            <p className="text-2xl font-bold">
              ${viewMode === 'kanban' 
                ? pipelineDetails?.totalValue.toLocaleString() 
                : tableDeals?.deals.reduce((sum, deal) => sum + (deal.value || 0), 0).toLocaleString()
              }
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Avg. Deal Size</h4>
            <p className="text-2xl font-bold">
              ${viewMode === 'kanban' 
                ? pipelineDetails?.averageDealValue.toLocaleString()
                : tableDeals?.deals.length 
                  ? Math.round(tableDeals.deals.reduce((sum, deal) => sum + (deal.value || 0), 0) / tableDeals.deals.length).toLocaleString()
                  : '0'
              }
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Win Rate</h4>
            <p className="text-2xl font-bold">
              {viewMode === 'kanban' 
                ? `${pipelineDetails?.winRate.toFixed(1)}%`
                : tableDeals?.deals.length
                  ? `${((tableDeals.deals.filter(d => d.stage.isWon).length / tableDeals.deals.filter(d => d.stage.isWon || d.stage.isLost).length) * 100 || 0).toFixed(1)}%`
                  : '0%'
              }
            </p>
          </div>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="animate-pulse">
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-96 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="h-96 bg-gray-200 rounded"></div>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
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
      ) : (
        <DealsTableView
          deals={tableDeals?.deals || []}
          isLoading={tableDealsLoading}
          sortBy={tableSortBy}
          sortOrder={tableSortOrder}
          onSort={handleTableSort}
        />
      )}

      <CreateDealDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onDealCreated={handleDealCreated} />
    </div>
  );
}
