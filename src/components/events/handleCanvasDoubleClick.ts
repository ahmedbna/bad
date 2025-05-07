import { Point } from '@/types';
import { DrawingTool } from '@/constants';

type Props = {
  e: React.MouseEvent<HTMLCanvasElement>;
  selectedTool: DrawingTool;
  drawingPoints: Array<Point>;
  splineTension: number;
  completeShape: (points: Array<Point>, options?: { tension?: number }) => void;
};

// Handle canvas double click (used to complete multi-point shapes like splines)
export const handleCanvasDoubleClick = ({
  e,
  selectedTool,
  drawingPoints,
  splineTension,
  completeShape,
}: Props) => {
  if (selectedTool === 'spline' && drawingPoints.length >= 3) {
    // Complete the spline with existing points
    completeShape(drawingPoints, { tension: splineTension });
  }
};
