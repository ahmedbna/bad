import { Entity, Point } from '@/hooks/CADContext';

type FinishRectangleProps = {
  endPoint: Point;
  drawingState: any;
  setDrawingState: (state: any) => void;
  addEntity: (entity: Omit<Entity, 'id'>) => void;
};

export const finishRectangle = ({
  endPoint,
  drawingState,
  setDrawingState,
  addEntity,
}: FinishRectangleProps) => {
  if (!drawingState.startPoint) return;

  const width = endPoint.x - drawingState.startPoint.x;
  const height = endPoint.y - drawingState.startPoint.y;

  // Only create rectangle if width and height are not zero
  if (width !== 0 && height !== 0) {
    addEntity({
      type: 'rectangle', // @ts-ignore
      topLeft: drawingState.startPoint,
      width,
      height,
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
