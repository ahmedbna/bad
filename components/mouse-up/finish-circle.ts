import { Entity, Point } from '@/hooks/CADContext';

type FinishCircleProps = {
  endPoint: Point;
  drawingState: any;
  setDrawingState: (state: any) => void;
  addEntity: (entity: Omit<Entity, 'id'>) => void;
};

export const finishCircle = ({
  endPoint,
  drawingState,
  setDrawingState,
  addEntity,
}: FinishCircleProps) => {
  if (!drawingState.startPoint) return;

  const radius = Math.sqrt(
    Math.pow(endPoint.x - drawingState.startPoint.x, 2) +
      Math.pow(endPoint.y - drawingState.startPoint.y, 2)
  );

  // Only create circle if radius is not zero
  if (radius > 0) {
    addEntity({
      type: 'circle', // @ts-ignore
      center: drawingState.startPoint,
      radius,
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
