import { Shape, Point } from '@/types';
import { SnapResult } from '../snap/useSnapping';
import { canvasToWorld } from '@/utils/canvasToWorld';
import {
  AreaSelectionState,
  startAreaSelection,
} from '../select/handleAreaSelection';

type Props = {
  e: React.MouseEvent<HTMLCanvasElement>;
  selectedTool: string;
  scale: number;
  offset: Point;
  drawingPoints: Point[];
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
  let snappedPoint: Point;
  if (snapEnabled && activeSnapResult) {
    snappedPoint = activeSnapResult.point;
  } else {
    snappedPoint = canvasToWorld({
      point: { x: mouseX, y: mouseY },
      offset,
      scale,
    });
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

  if (selectedTool === 'polyline') {
    const newPoints = [...drawingPoints, snappedPoint];
    setDrawingPoints(newPoints);

    setTempShape({
      id: 'temp-polyline',
      type: 'polyline',
      points: newPoints,
      properties: {},
    });
  }
};
