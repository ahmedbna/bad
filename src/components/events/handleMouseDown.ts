import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { snapPointToGrid } from '@/utils/snapPointToGrid';
import { AreaSelectionState, startAreaSelection } from './handleAreaSelection';
import { SnapResult } from '../snap/useSnapping';

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
  setAreaSelection: React.Dispatch<React.SetStateAction<AreaSelectionState>>;
  snapEnabled: boolean;
  activeSnapResult: SnapResult;
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
  setAreaSelection,
  snapEnabled,
  activeSnapResult,
}: Props) => {
  // Get mouse position in canvas coordinates
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Use snap point if available, otherwise calculate world point
  let worldPoint: Point;
  if (snapEnabled && activeSnapResult) {
    worldPoint = activeSnapResult.point;
  } else {
    worldPoint = canvasToWorld({
      point: { x: mouseX, y: mouseY },
      offset,
      scale,
    });

    // Apply grid snapping if enabled and no other snap is active
    if (snapToGrid && !activeSnapResult) {
      worldPoint = {
        x: Math.round(worldPoint.x / gridSize) * gridSize,
        y: Math.round(worldPoint.y / gridSize) * gridSize,
      };
    }
  }

  if (selectedTool === 'select') {
    // Start area selection
    startAreaSelection(e, scale, offset, setAreaSelection);
  }

  if (selectedTool === 'pan' && e.button === 0) {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - e.currentTarget.getBoundingClientRect().left,
      y: e.clientY - e.currentTarget.getBoundingClientRect().top,
    });
  }

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
