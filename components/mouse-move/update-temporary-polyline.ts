import { Point } from '@/hooks/CADContext';
import { DrawingState } from '../cad/canvas';

type TemporaryPolylineProps = {
  currentPoint: Point;
  drawingState: DrawingState;
  setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
};

export const updateTemporaryPolyline = ({
  currentPoint,
  drawingState,
  setDrawingState,
}: TemporaryPolylineProps) => {
  if (!drawingState.isDrawing || drawingState.points.length === 0) return;

  // Update temporary preview line to current mouse position
  const updatedPoints = [...drawingState.points, currentPoint];

  setDrawingState((prev) => ({
    ...prev,
    temporaryEntity: {
      ...prev.temporaryEntity,
      points: updatedPoints,
    },
  }));
};
