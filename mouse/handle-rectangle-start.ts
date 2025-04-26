import { Point } from '@/hooks/CADContext';
import { DrawingState } from '@/components/cad/canvas';

type RectangleStartProps = {
  startPoint: Point;
  setDrawingState: (drawingState: DrawingState) => void;
};

// Rectangle tool handlers
export const handleRectangleStart = ({
  startPoint,
  setDrawingState,
}: RectangleStartProps) => {
  setDrawingState({
    isDrawing: true,
    startPoint,
    points: [],
    temporaryEntity: {
      type: 'rectangle',
      topLeft: startPoint,
      width: 0,
      height: 0,
      properties: {
        strokeColor: '#3498db',
        strokeWidth: 2,
      },
    },
  });
};
