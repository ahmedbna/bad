import { Point } from '@/hooks/CADContext';
import { DrawingState } from '../cad/canvas';

type TemporaryRectangleProps = {
  currentPoint: Point;
  drawingState: DrawingState;
  setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
};

export const updateTemporaryRectangle = ({
  currentPoint,
  drawingState,
  setDrawingState,
}: TemporaryRectangleProps) => {
  if (!drawingState.startPoint) return;

  const width = currentPoint.x - drawingState.startPoint.x;
  const height = currentPoint.y - drawingState.startPoint.y;

  setDrawingState((prev) => ({
    ...prev,
    temporaryEntity: {
      ...prev.temporaryEntity,
      width,
      height,
    },
  }));
};
