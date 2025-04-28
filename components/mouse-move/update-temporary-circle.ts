import { Point } from '@/hooks/CADContext';
import { DrawingState } from '../cad/canvas';

type TemporaryCircleProps = {
  currentPoint: Point;
  drawingState: DrawingState;
  setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
};

export const updateTemporaryCircle = ({
  currentPoint,
  drawingState,
  setDrawingState,
}: TemporaryCircleProps) => {
  if (!drawingState.startPoint) return;

  const radius = Math.sqrt(
    Math.pow(currentPoint.x - drawingState.startPoint.x, 2) +
      Math.pow(currentPoint.y - drawingState.startPoint.y, 2)
  );

  setDrawingState((prev) => ({
    ...prev,
    temporaryEntity: {
      ...prev.temporaryEntity,
      radius,
    },
  }));
};
