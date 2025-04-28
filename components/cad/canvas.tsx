'use client';

import React, {
  useRef,
  useEffect,
  useState,
  MouseEvent,
  WheelEvent,
} from 'react';
import { Entity, useCADContext } from '@/hooks/CADContext';
import { redraw } from '@/draw/redraw';
import { getCursorPosition } from '@/components/cursor/get-cursor-position';
import { handleMouseDown } from '@/components/mouse-down/handle-mouse-down';
import { handleMouseUp } from '@/components/mouse-up/handle-mouse-up';
import { handleMouseMove } from '../mouse-move/handle-mouse-move';

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

  const handleDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'polyline' && drawingState.isDrawing) {
      finishPolyline();
    }
  };

  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Get mouse position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate world position before zoom
    const worldPos = screenToWorld({ x: mouseX, y: mouseY });

    // Calculate zoom factor
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = viewState.zoom * zoomFactor;

    // Limit zoom levels if needed
    const limitedZoom = Math.max(0.1, Math.min(10, newZoom));

    // Calculate new pan offset to keep point under mouse
    const newPanX = mouseX - worldPos.x * limitedZoom;
    const newPanY = mouseY - worldPos.y * limitedZoom;

    setViewState((prev) => ({
      ...prev,
      zoom: limitedZoom,
      panOffset: {
        x: newPanX,
        y: newPanY,
      },
    }));
  };

  const isPointOnEntity = (point: Point, entity: any): boolean => {
    const tolerance = 5 / viewState.zoom; // 5px in world coordinates

    switch (entity.type) {
      case 'line': {
        return isPointOnLine(point, entity.start, entity.end, tolerance);
      }
      case 'circle': {
        const distance = Math.sqrt(
          Math.pow(point.x - entity.center.x, 2) +
            Math.pow(point.y - entity.center.y, 2)
        );
        return Math.abs(distance - entity.radius) <= tolerance;
      }
      case 'rectangle': {
        return (
          point.x >= entity.topLeft.x - tolerance &&
          point.x <= entity.topLeft.x + entity.width + tolerance &&
          point.y >= entity.topLeft.y - tolerance &&
          point.y <= entity.topLeft.y + entity.height + tolerance &&
          // Check if point is close to any edge
          (Math.abs(point.x - entity.topLeft.x) <= tolerance ||
            Math.abs(point.x - (entity.topLeft.x + entity.width)) <=
              tolerance ||
            Math.abs(point.y - entity.topLeft.y) <= tolerance ||
            Math.abs(point.y - (entity.topLeft.y + entity.height)) <= tolerance)
        );
      }
      case 'polyline': {
        if (!entity.points || entity.points.length < 2) return false;

        for (let i = 0; i < entity.points.length - 1; i++) {
          if (
            isPointOnLine(
              point,
              entity.points[i],
              entity.points[i + 1],
              tolerance
            )
          ) {
            return true;
          }
        }
        return false;
      }
      case 'text': {
        // Simple box check for text
        const textWidth = entity.content.length * entity.fontSize * 0.6; // Approximation
        const textHeight = entity.fontSize;

        return (
          point.x >= entity.position.x &&
          point.x <= entity.position.x + textWidth &&
          point.y >= entity.position.y &&
          point.y <= entity.position.y + textHeight
        );
      }
      default:
        return false;
    }
  };

  const isPointOnLine = (
    point: Point,
    lineStart: Point,
    lineEnd: Point,
    tolerance: number
  ): boolean => {
    const lineLength = Math.sqrt(
      Math.pow(lineEnd.x - lineStart.x, 2) +
        Math.pow(lineEnd.y - lineStart.y, 2)
    );

    if (lineLength === 0) return false;

    // Distance from point to line
    const distance =
      Math.abs(
        (lineEnd.y - lineStart.y) * point.x -
          (lineEnd.x - lineStart.x) * point.y +
          lineEnd.x * lineStart.y -
          lineEnd.y * lineStart.x
      ) / lineLength;

    // Check if point is within line segment bounds
    const dotProduct =
      (point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
      (point.y - lineStart.y) * (lineEnd.y - lineStart.y);

    const squaredLineLength = lineLength * lineLength;

    return (
      distance <= tolerance &&
      dotProduct >= 0 &&
      dotProduct <= squaredLineLength
    );
  };

  const finishPolyline = () => {
    // Only create polyline if it has at least 2 points
    if (drawingState.points.length >= 2) {
      addEntity({
        type: 'polyline', // @ts-ignore
        points: [...drawingState.points],
        properties: {
          strokeColor: '#000000',
          strokeWidth: 1,
        },
      });
    }

    // Reset drawing state
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      points: [],
      temporaryEntity: null,
    });
  };

  // Set cursor based on current tool
  const getCursorStyle = (): string => {
    if (isPanning) return 'grabbing';

    switch (currentTool) {
      case 'pointer':
        return 'default';
      case 'line':
      case 'circle':
      case 'rectangle':
      case 'polyline':
        return 'crosshair';
      case 'text':
        return 'text';
      default:
        return 'default';
    }
  };

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
      style={{ cursor: getCursorStyle() }}
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
          isPointOnEntity,
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
        })
      }
      onMouseUp={(event) =>
        handleMouseUp({
          event,
          isPanning,
          canvasRef,
          viewState,
          currentTool,
          drawingState,
          setIsPanning,
          addEntity,
          setDrawingState,
          screenToWorld,
          snapToGrid,
        })
      }
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right-click
    />
  );
}
