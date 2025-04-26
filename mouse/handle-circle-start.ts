import { DrawingState } from '@/components/cad/canvas';
import { Point } from '@/hooks/CADContext';

type CricleStartProps = {
  centerPoint: Point;
  setDrawingState: (drawingState: DrawingState) => void;
};

// Circle tool handlers
export const handleCircleStart = ({
  centerPoint,
  setDrawingState,
}: CricleStartProps) => {
  setDrawingState({
    isDrawing: true,
    startPoint: centerPoint,
    points: [],
    temporaryEntity: {
      type: 'circle',
      center: centerPoint,
      radius: 0,
      properties: {
        strokeColor: '#3498db',
        strokeWidth: 2,
      },
    },
  });
};
