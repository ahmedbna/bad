import { Point, ViewState } from '@/hooks/CADContext';
import { MouseEvent } from 'react';
import { getCursorPosition } from '../cursor/get-cursor-position';
import { finishLine } from './finish-line';
import { finishCircle } from './finish-circle';
import { finishRectangle } from './finish-rectangle';

type MouseUpProps = {
  event: MouseEvent<HTMLCanvasElement>;
  isPanning: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewState: ViewState;
  drawingState: any;
  currentTool: string | null;
  addEntity: (entity: Omit<any, 'id'>) => void; // Replace with the actual type of your entitie
  setDrawingState: (state: any) => void;
  snapToGrid: (point: Point) => Point;
  setIsPanning: (isPanning: boolean) => void;
  screenToWorld: (point: Point) => Point;
};

export const handleMouseUp = ({
  event,
  isPanning,
  canvasRef,
  viewState,
  currentTool,
  drawingState,
  addEntity,
  setDrawingState,
  setIsPanning,
  screenToWorld,
  snapToGrid,
}: MouseUpProps) => {
  // End panning
  if (isPanning) {
    setIsPanning(false);
    return;
  }

  // Handle drawing completion
  if (drawingState.isDrawing && event.button === 0) {
    const cursorPos = getCursorPosition({
      event,
      canvasRef,
      viewState,
      screenToWorld,
      snapToGrid,
    });

    switch (currentTool) {
      case 'line':
        finishLine({
          endPoint: cursorPos,
          drawingState,
          setDrawingState,
          addEntity,
        });
        break;
      case 'circle':
        finishCircle({
          endPoint: cursorPos,
          drawingState,
          setDrawingState,
          addEntity,
        });
        break;
      case 'rectangle':
        finishRectangle({
          endPoint: cursorPos,
          drawingState,
          setDrawingState,
          addEntity,
        });
        break;
      // Note: Polylines are handled differently - they finish on double-click
      default:
        break;
    }
  }
};
