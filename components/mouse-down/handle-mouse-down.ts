import { MouseEvent } from 'react';
import { getCursorPosition } from '../cursor/get-cursor-position';
import { Entity, Point, ViewState } from '@/hooks/CADContext';
import { handleSelectionStart } from './handle-selection-start';
import { handleLineStart } from './handle-line-start';
import { handleCircleStart } from './handle-circle-start';
import { handleRectangleStart } from './handle-rectangle-start';
import { handlePolylinePoint } from './handle-polyline-point';
import { handleTextPlacement } from './handle-text-placement';
import { DrawingState } from '@/components/cad/canvas';

type MouseDownProps = {
  event: MouseEvent<HTMLCanvasElement>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewState: ViewState;
  currentTool: string | null;
  entities: any[];
  drawingState: DrawingState;
  selectedEntities: string[];
  addEntity: (entity: Omit<Entity, 'id'>) => void;
  setSelectedEntities: (entities: any[]) => void;
  setDrawingState: (drawingState: DrawingState) => void;
  screenToWorld: (point: Point) => Point;
  snapToGrid: (point: Point) => Point;
  setIsPanning: (isPanning: boolean) => void;
  setLastPanPoint: (point: Point) => void;
};

// Handle mouse events for drawing tools
export const handleMouseDown = ({
  event,
  canvasRef,
  viewState,
  currentTool,
  screenToWorld,
  snapToGrid,
  setIsPanning,
  setLastPanPoint,
  entities,
  drawingState,
  setSelectedEntities,
  selectedEntities,
  setDrawingState,
  addEntity,
}: MouseDownProps) => {
  // Middle mouse button (or Ctrl+Left click) for panning
  if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
    setIsPanning(true);
    setLastPanPoint({ x: event.clientX, y: event.clientY });
    event.preventDefault();
    return;
  }

  // Left click for drawing or selection
  if (event.button === 0) {
    const cursorPos = getCursorPosition({
      event,
      canvasRef,
      viewState,
      screenToWorld,
      snapToGrid,
    });

    // Handle different tools
    switch (currentTool) {
      case 'pointer':
        handleSelectionStart({
          event,
          point: cursorPos,
          viewState,
          entities,
          setSelectedEntities,
          selectedEntities,
        });
        break;
      case 'line':
        handleLineStart({ startPoint: cursorPos, setDrawingState });
        break;
      case 'circle':
        handleCircleStart({ centerPoint: cursorPos, setDrawingState });
        break;
      case 'rectangle':
        handleRectangleStart({ startPoint: cursorPos, setDrawingState });
        break;
      case 'polyline':
        handlePolylinePoint({
          point: cursorPos,
          drawingState,
          setDrawingState,
        });
        break;
      case 'text':
        handleTextPlacement({ point: cursorPos, addEntity });
        break;
      default:
        break;
    }
  }
};
