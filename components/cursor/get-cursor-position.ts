import { MouseEvent } from 'react';
import { Point, ViewState } from '@/hooks/CADContext';

type CursorPositionProps = {
  event: MouseEvent<HTMLCanvasElement>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewState: ViewState;
  screenToWorld: (point: Point) => Point;
  snapToGrid: (point: Point) => Point;
};

// Get cursor position in world coordinates
export const getCursorPosition = ({
  event,
  canvasRef,
  viewState,
  screenToWorld,
  snapToGrid,
}: CursorPositionProps): Point => {
  const canvas = canvasRef.current;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const screenPoint = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  let worldPoint = screenToWorld(screenPoint);

  // Apply grid snapping if enabled
  if (viewState.grid.snap) {
    worldPoint = snapToGrid(worldPoint);
  }

  return worldPoint;
};
