import { Entity, Point } from '@/hooks/CADContext';

type FinishLineProps = {
  endPoint: Point;
  drawingState: any;
  setDrawingState: (state: any) => void;
  addEntity: (entity: Omit<Entity, 'id'>) => void;
};

export const finishLine = ({
  endPoint,
  drawingState,
  setDrawingState,
  addEntity,
}: FinishLineProps) => {
  if (!drawingState.startPoint) return;

  // Only create line if start and end are different
  if (
    drawingState.startPoint.x !== endPoint.x ||
    drawingState.startPoint.y !== endPoint.y
  ) {
    addEntity({
      type: 'line', // @ts-ignore
      start: drawingState.startPoint,
      end: endPoint,
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
