'use client';

import { useRef, useEffect, useState } from 'react';
import { redraw } from '@/components/draw/redraw';
import { useCADContext } from '@/hooks/CADContext';
import { handleMouseDown } from '@/components/mouse-down/handle-mouse-down';
import { handleMouseUp } from '@/components/mouse-up/handle-mouse-up';
import { handleMouseMove } from '@/components/mouse-move/handle-mouse-move';
import { getCursorStyle } from '@/components/cursor/get-cursor-style';
import { finishPolyline } from '@/components/cursor/finish-polyline';
import { handleWheel } from '@/components/cursor/handle-wheel';

// Define point interface for local use
interface Point {
  x: number;
  y: number;
}

// Interface for drawing state
export interface DrawingState {
  isDrawing: boolean;
  startPoint: Point | null;
  points: Point[];
  temporaryEntity: any | null;
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    points: [],
    temporaryEntity: null,
  });

  const {
    viewState,
    setViewState,
    entities,
    selectedEntities,
    currentTool,
    setSelectedEntities,
    addEntity,
    deleteEntities,
    screenToWorld,
    worldToScreen,
    snapToGrid,
  } = useCADContext();

  // Initialize the canvas on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      redraw({
        canvasRef,
        viewState,
        drawingState,
        entities,
        selectedEntities,
        worldToScreen,
      });
    };

    // Set up event listeners
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Redraw when entities or viewState change
  useEffect(() => {
    redraw({
      canvasRef,
      viewState,
      drawingState,
      entities,
      selectedEntities,
      worldToScreen,
    });
  }, [viewState, drawingState, entities, selectedEntities]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to cancel current drawing action
      if (e.key === 'Escape') {
        setDrawingState({
          isDrawing: false,
          startPoint: null,
          points: [],
          temporaryEntity: null,
        });
      }

      // Delete key to remove selected entities
      if (e.key === 'Delete' && selectedEntities.length > 0) {
        // This should be implemented in CADContext
        // deleteSelectedEntities();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedEntities]);

  return (
    <canvas
      ref={canvasRef}
      className='w-full h-full'
      style={{ cursor: getCursorStyle({ isPanning, currentTool }) }}
      onMouseDown={(event) =>
        handleMouseDown({
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
        })
      }
      onMouseMove={(event) =>
        handleMouseMove({
          event,
          isPanning,
          canvasRef,
          currentTool,
          viewState,
          drawingState,
          lastPanPoint,
          screenToWorld,
          snapToGrid,
          setDrawingState,
          setLastPanPoint,
          setViewState,
        })
      }
      onMouseUp={(event) =>
        handleMouseUp({
          event,
          isPanning,
          canvasRef,
          currentTool,
          viewState,
          drawingState,
          setIsPanning,
          addEntity,
          setDrawingState,
          screenToWorld,
          snapToGrid,
        })
      }
      onDoubleClick={(event) => {
        if (currentTool === 'polyline' && drawingState.isDrawing) {
          finishPolyline({
            drawingState,
            setDrawingState,
            addEntity,
          });
        }
      }}
      onWheel={(event) =>
        handleWheel({
          event,
          canvasRef,
          viewState,
          setViewState,
          screenToWorld,
        })
      }
      onContextMenu={(event) => event.preventDefault()} // Prevent context menu on right-click
    />
  );
}
