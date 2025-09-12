import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

interface StageColumnProps {
  stage: {
    id: number;
    name: string;
  };
  children: React.ReactNode;
  dealsCount: number;
  totalValue: number;
}

export function StageColumn({ stage, children, dealsCount, totalValue }: StageColumnProps) {
  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div data-testid="stage-column" className="min-w-80 lg:min-w-0">
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-900">{stage.name || 'Unnamed Stage'}</h3>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <span>{dealsCount} deals</span>
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
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
