import { Point } from '@/hooks/CADContext';
import { DrawingState } from '@/components/cad/canvas';

type LineStartProps = {
  startPoint: Point;
  setDrawingState: (drawingState: DrawingState) => void;
};

// Line tool handlers
export const handleLineStart = ({
  startPoint,
  setDrawingState,
}: LineStartProps) => {
  setDrawingState({
    isDrawing: true,
    startPoint,
    points: [],
    temporaryEntity: {
      type: 'line',
      start: startPoint,
      end: startPoint,
      properties: {
        strokeColor: '#3498db',
        strokeWidth: 2,
      },
    },
  });
};
