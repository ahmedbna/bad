import { Point } from '@/hooks/CADContext';
import { DrawingState } from '../cad/canvas';

type TemporaryLineProps = {
  currentPoint: Point;
  drawingState: DrawingState;
  setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
};

export const updateTemporaryLine = ({
  currentPoint,
  drawingState,
  setDrawingState,
}: TemporaryLineProps) => {
  if (!drawingState.startPoint) return;

  setDrawingState((prev) => ({
    ...prev,
    temporaryEntity: {
      ...prev.temporaryEntity,
      end: currentPoint,
    },
  }));
};
