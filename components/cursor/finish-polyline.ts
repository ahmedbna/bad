import { Entity } from '@/hooks/CADContext';
import { DrawingState } from '../cad/canvas';

type FinishPolylineProps = {
  drawingState: DrawingState;
  setDrawingState: (drawingState: DrawingState) => void;
  addEntity: (entity: Omit<Entity, 'id'>) => void;
};

export const finishPolyline = ({
  drawingState,
  setDrawingState,
  addEntity,
}: FinishPolylineProps) => {
  // Only create polyline if it has at least 2 points
  if (drawingState.points.length >= 2) {
    addEntity({
      type: 'polyline', // @ts-ignore
      points: [...drawingState.points],
      properties: {
        strokeColor: '#000000',
        strokeWidth: 1,
      },
    });
  }

  // Reset drawing state
  setDrawingState({
    isDrawing: false,
    startPoint: null,
    points: [],
    temporaryEntity: null,
  });
};
