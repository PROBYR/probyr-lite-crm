import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import backend from '~backend/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface StageFormData {
  id: string;
  name: string;
  isWon: boolean;
  isLost: boolean;
}

interface CreatePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPipelineCreated: () => void;
}

export function CreatePipelineDialog({ open, onOpenChange, onPipelineCreated }: CreatePipelineDialogProps) {
  const [pipelineName, setPipelineName] = useState('');
  const [stages, setStages] = useState<StageFormData[]>([
    { id: '1', name: 'Lead', isWon: false, isLost: false },
    { id: '2', name: 'Qualified', isWon: false, isLost: false },
    { id: '3', name: 'Proposal', isWon: false, isLost: false },
    { id: '4', name: 'Negotiation', isWon: false, isLost: false },
    { id: '5', name: 'Won', isWon: true, isLost: false },
    { id: '6', name: 'Lost', isWon: false, isLost: true },
  ]);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; stages: StageFormData[] }) => {
      return await backend.pipelines.create({
        name: data.name,
        companyId: 1, // Demo company
        stages: data.stages.map((stage, index) => ({
          name: stage.name,
          position: index + 1,
          isWon: stage.isWon,
          isLost: stage.isLost,
        })),
      });
    },
    onSuccess: () => {
      onPipelineCreated();
      resetForm();
    },
    onError: (error) => {
      console.error('Failed to create pipeline:', error);
      toast({
        title: "Error",
        description: "Failed to create pipeline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPipelineName('');
    setStages([
      { id: '1', name: 'Lead', isWon: false, isLost: false },
      { id: '2', name: 'Qualified', isWon: false, isLost: false },
      { id: '3', name: 'Proposal', isWon: false, isLost: false },
      { id: '4', name: 'Negotiation', isWon: false, isLost: false },
      { id: '5', name: 'Won', isWon: true, isLost: false },
      { id: '6', name: 'Lost', isWon: false, isLost: true },
    ]);
  };

  const addStage = () => {
    const newId = Math.max(...stages.map(s => parseInt(s.id))) + 1;
    setStages([...stages, { id: String(newId), name: '', isWon: false, isLost: false }]);
  };

  const removeStage = (id: string) => {
    if (stages.length <= 2) {
      toast({
        title: "Error",
        description: "A pipeline must have at least 2 stages.",
        variant: "destructive",
      });
      return;
    }
    setStages(stages.filter(stage => stage.id !== id));
  };

  const updateStage = (id: string, field: keyof StageFormData, value: string | boolean) => {
    setStages(stages.map(stage => 
      stage.id === id ? { ...stage, [field]: value } : stage
    ));
  };

  const moveStage = (fromIndex: number, toIndex: number) => {
    const newStages = [...stages];
    const [movedStage] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, movedStage);
    setStages(newStages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pipelineName.trim()) {
      toast({
        title: "Error",
        description: "Pipeline name is required.",
        variant: "destructive",
      });
      return;
    }

    const hasEmptyStage = stages.some(stage => !stage.name.trim());
    if (hasEmptyStage) {
      toast({
        title: "Error",
        description: "All stages must have names.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({ name: pipelineName, stages });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Pipeline</DialogTitle>
          <DialogDescription>
            Create a new sales pipeline with custom stages. You can reorder stages by dragging them.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="pipeline-name">Pipeline Name *</Label>
            <Input
              id="pipeline-name"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="e.g., Enterprise Sales, SMB Pipeline"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Pipeline Stages</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStage}>
                <Plus className="w-4 h-4 mr-2" />
                Add Stage
              </Button>
            </div>

            <div className="space-y-3">
              {stages.map((stage, index) => (
                <Card key={stage.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="cursor-move">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                      
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                          placeholder="Stage name"
                        />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`won-${stage.id}`}
                            checked={stage.isWon}
                            onCheckedChange={(checked) => updateStage(stage.id, 'isWon', !!checked)}
                          />
                          <Label htmlFor={`won-${stage.id}`} className="text-sm">Won</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`lost-${stage.id}`}
                            checked={stage.isLost}
                            onCheckedChange={(checked) => updateStage(stage.id, 'isLost', !!checked)}
                          />
                          <Label htmlFor={`lost-${stage.id}`} className="text-sm">Lost</Label>
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStage(stage.id)}
                          disabled={stages.length <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Pipeline'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
