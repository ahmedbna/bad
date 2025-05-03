import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { snapPointToGrid } from '@/utils/snapPointToGrid';

type Props = {
  e: React.MouseEvent<HTMLCanvasElement>;
  selectedTool: string;
  scale: number;
  offset: Point;
  drawingPoints: Point[];
  snapToGrid: boolean;
  gridSize: number;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setDragStart: React.Dispatch<React.SetStateAction<Point>>;
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
};

// Handle mouse down
export const handleMouseDown = ({
  e,
  selectedTool,
  scale,
  offset,
  drawingPoints,
  snapToGrid,
  gridSize,
  setIsDragging,
  setDragStart,
  setDrawingPoints,
  setTempShape,
}: Props) => {
  if (selectedTool === 'pan' && e.button === 0) {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - e.currentTarget.getBoundingClientRect().left,
      y: e.clientY - e.currentTarget.getBoundingClientRect().top,
    });
  }

  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const worldPoint = canvasToWorld({
    point: { x: mouseX, y: mouseY },
    scale,
    offset,
  });
  const snappedPoint = snapPointToGrid({
    point: worldPoint,
    snapToGrid,
    gridSize,
  });

  if (selectedTool === 'polyline') {
    const newPoints = [...drawingPoints, snappedPoint];
    setDrawingPoints(newPoints);

    setTempShape({
      id: 'temp-polyline',
      type: 'polyline',
      points: newPoints,
    });
  }
};
