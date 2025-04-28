import { MouseEvent } from 'react';
import { getCursorPosition } from '../cursor/get-cursor-position';
import { updateTemporaryCircle } from './update-temporary-circle';
import { updateTemporaryLine } from './update-temporary-line';
import { updateTemporaryPolyline } from './update-temporary-polyline';
import { updateTemporaryRectangle } from './update-temporary-rectangle';
import { DrawingState } from '../cad/canvas';
import { Point, ViewState } from '@/hooks/CADContext';

type MouseMoveProps = {
  event: MouseEvent<HTMLCanvasElement>;
  isPanning: boolean;
  currentTool: string | null;
  lastPanPoint: Point;
  viewState: ViewState;
  drawingState: DrawingState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  setLastPanPoint: (point: Point) => void;
  screenToWorld: (point: Point) => Point;
  snapToGrid: (point: Point) => Point;
};

export const handleMouseMove = ({
  event,
  isPanning,
  currentTool,
  lastPanPoint,
  drawingState,
  canvasRef,
  viewState,
  screenToWorld,
  snapToGrid,
  setDrawingState,
  setLastPanPoint,
  setViewState,
}: MouseMoveProps) => {
  // Handle panning
  if (isPanning) {
    const dx = event.clientX - lastPanPoint.x;
    const dy = event.clientY - lastPanPoint.y;

    setViewState((prev) => ({
      ...prev,
      panOffset: {
        x: prev.panOffset.x + dx,
        y: prev.panOffset.y + dy,
      },
    }));

    setLastPanPoint({ x: event.clientX, y: event.clientY });
    return;
  }

  // Handle drawing tools
  if (drawingState.isDrawing) {
    const cursorPos = getCursorPosition({
      event,
      canvasRef,
      viewState,
      screenToWorld,
      snapToGrid,
    });

    switch (currentTool) {
      case 'line':
        updateTemporaryLine({
          currentPoint: cursorPos,
          drawingState,
          setDrawingState,
        });
        break;
      case 'circle':
        updateTemporaryCircle({
          currentPoint: cursorPos,
          drawingState,
          setDrawingState,
        });
        break;
      case 'rectangle':
        updateTemporaryRectangle({
          currentPoint: cursorPos,
          drawingState,
          setDrawingState,
        });
        break;
      case 'polyline':
        updateTemporaryPolyline({
          currentPoint: cursorPos,
          drawingState,
          setDrawingState,
        });
        break;
      default:
        break;
    }
  }
};
