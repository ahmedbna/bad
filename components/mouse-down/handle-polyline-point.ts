import { Point } from '@/hooks/CADContext';
import { DrawingState } from '@/components/cad/canvas';

type RectangleStartProps = {
  point: Point;
  drawingState: DrawingState;
  setDrawingState: (drawingState: DrawingState) => void;
};

// Polyline tool handlers
export const handlePolylinePoint = ({
  point,
  drawingState,
  setDrawingState,
}: RectangleStartProps) => {
  if (!drawingState.isDrawing) {
    // Start a new polyline
    setDrawingState({
      isDrawing: true,
      startPoint: point,
      points: [point],
      temporaryEntity: {
        type: 'polyline',
        points: [point],
        properties: {
          strokeColor: '#3498db',
          strokeWidth: 2,
        },
      },
    });
  } else {
    // Add point to existing polyline
    setDrawingState({
      ...drawingState,
      points: [...drawingState.points, point],
      temporaryEntity: {
        ...drawingState.temporaryEntity,
        points: [...drawingState.points, point],
      },
    });
  }
};
