'use client';

import React, {
  useRef,
  useEffect,
  useState,
  MouseEvent,
  WheelEvent,
} from 'react';
import { Entity, useCADContext } from '@/hooks/CADContext';
import { drawGrid } from '@/lib/draw-grid';

// Define point interface for local use
interface Point {
  x: number;
  y: number;
}

// Interface for drawing state
interface DrawingState {
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
      redraw();
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
    redraw();
  }, [entities, viewState, selectedEntities, drawingState]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid if enabled
    if (viewState.grid.enabled) {
      drawGrid(viewState, ctx, width, height);
    }

    // Draw origin
    drawOrigin(ctx);

    // Draw all entities
    drawEntities(ctx);

    // Draw selection highlights
    drawSelectionHighlights(ctx);

    // Draw temporary elements based on current tool and drawing state
    if (drawingState.isDrawing && drawingState.temporaryEntity) {
      drawTemporaryEntity(ctx, drawingState.temporaryEntity);
    }
  };

  const drawOrigin = (ctx: CanvasRenderingContext2D) => {
    const { panOffset } = viewState;

    // Calculate origin position
    const originX = panOffset.x;
    const originY = panOffset.y;

    // Draw origin crosshair
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 1;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(originX - 10, originY);
    ctx.lineTo(originX + 10, originY);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(originX, originY - 10);
    ctx.lineTo(originX, originY + 10);
    ctx.stroke();
  };

  const drawEntities = (ctx: CanvasRenderingContext2D) => {
    // Draw each entity based on its type and properties
    entities.forEach((entity: any) => {
      const strokeColor = entity.properties?.strokeColor || '#000';
      const strokeWidth = entity.properties?.strokeWidth || 1;
      const fillColor = entity.properties?.fillColor;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;

      if (fillColor) {
        ctx.fillStyle = fillColor;
      }

      switch (entity.type) {
        case 'line':
          drawLine(ctx, entity);
          break;
        case 'circle':
          drawCircle(ctx, entity);
          break;
        case 'rectangle':
          drawRectangle(ctx, entity);
          break;
        case 'polyline':
          drawPolyline(ctx, entity);
          break;
        case 'text':
          drawText(ctx, entity);
          break;
        default:
          console.warn(`Unknown entity type: ${entity.type}`);
      }
    });
  };

  const drawSelectionHighlights = (ctx: CanvasRenderingContext2D) => {
    if (!selectedEntities.length) return;

    selectedEntities.forEach((id) => {
      const entity = entities.find((e) => e.id === id);
      if (!entity) return;

      // Draw selection highlight
      ctx.strokeStyle = '#1E90FF';
      ctx.lineWidth = 2;

      switch (entity.type) {
        case 'line': {
          const startPoint = worldToScreen(entity.start);
          const endPoint = worldToScreen(entity.end);

          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();

          // Draw handles
          drawPointHandle(ctx, startPoint);
          drawPointHandle(ctx, endPoint);
          break;
        }
        case 'circle': {
          const centerPoint = worldToScreen(entity.center);
          const radius = entity.radius * viewState.zoom;

          ctx.beginPath();
          ctx.arc(centerPoint.x, centerPoint.y, radius, 0, Math.PI * 2);
          ctx.stroke();

          // Draw handles
          drawPointHandle(ctx, centerPoint);
          drawPointHandle(ctx, {
            x: centerPoint.x + radius,
            y: centerPoint.y,
          });
          break;
        }
        case 'rectangle': {
          const topLeft = worldToScreen(entity.topLeft);
          const width = entity.width * viewState.zoom;
          const height = entity.height * viewState.zoom;

          ctx.beginPath();
          ctx.rect(topLeft.x, topLeft.y, width, height);
          ctx.stroke();

          // Draw handles
          drawPointHandle(ctx, topLeft);
          drawPointHandle(ctx, { x: topLeft.x + width, y: topLeft.y });
          drawPointHandle(ctx, { x: topLeft.x, y: topLeft.y + height });
          drawPointHandle(ctx, { x: topLeft.x + width, y: topLeft.y + height });
          break;
        }
        case 'polyline': {
          if (!entity.points || entity.points.length < 2) return;

          const transformedPoints = entity.points.map(worldToScreen);

          ctx.beginPath();
          ctx.moveTo(transformedPoints[0].x, transformedPoints[0].y);

          for (let i = 1; i < transformedPoints.length; i++) {
            ctx.lineTo(transformedPoints[i].x, transformedPoints[i].y);
          }

          ctx.stroke();

          // Draw handles at each point
          transformedPoints.forEach((point) => {
            drawPointHandle(ctx, point);
          });
          break;
        }
        case 'text': {
          const position = worldToScreen(entity.position);

          // Draw a box around the text
          const textWidth = ctx.measureText(entity.content).width;
          const textHeight = entity.fontSize * viewState.zoom;

          ctx.beginPath();
          ctx.rect(
            position.x - 2,
            position.y - 2,
            textWidth + 4,
            textHeight + 4
          );
          ctx.stroke();

          // Draw handle at text position
          drawPointHandle(ctx, position);
          break;
        }
      }
    });
  };

  const drawPointHandle = (ctx: CanvasRenderingContext2D, point: Point) => {
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawLine = (ctx: CanvasRenderingContext2D, entity: any) => {
    const startPoint = worldToScreen(entity.start);
    const endPoint = worldToScreen(entity.end);

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, entity: any) => {
    const centerPoint = worldToScreen(entity.center);
    const radius = entity.radius * viewState.zoom;

    ctx.beginPath();
    ctx.arc(centerPoint.x, centerPoint.y, radius, 0, Math.PI * 2);
    if (entity.properties?.fillColor) {
      ctx.fill();
    }
    ctx.stroke();
  };

  const drawRectangle = (ctx: CanvasRenderingContext2D, entity: any) => {
    const topLeft = worldToScreen(entity.topLeft);
    const width = entity.width * viewState.zoom;
    const height = entity.height * viewState.zoom;

    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, width, height);
    if (entity.properties?.fillColor) {
      ctx.fill();
    }
    ctx.stroke();
  };

  const drawPolyline = (ctx: CanvasRenderingContext2D, entity: any) => {
    if (!entity.points || entity.points.length < 2) return;

    const transformedPoints = entity.points.map(worldToScreen);

    ctx.beginPath();
    ctx.moveTo(transformedPoints[0].x, transformedPoints[0].y);

    for (let i = 1; i < transformedPoints.length; i++) {
      ctx.lineTo(transformedPoints[i].x, transformedPoints[i].y);
    }

    ctx.stroke();
  };

  const drawText = (ctx: CanvasRenderingContext2D, entity: any) => {
    const position = worldToScreen(entity.position);

    ctx.font = `${entity.fontSize * viewState.zoom}px ${
      entity.fontFamily || 'Arial'
    }`;
    ctx.fillStyle = entity.properties?.strokeColor || '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText(entity.content, position.x, position.y);
  };

  const drawTemporaryEntity = (ctx: CanvasRenderingContext2D, entity: any) => {
    ctx.strokeStyle = entity.properties?.strokeColor || '#3498db';
    ctx.lineWidth = entity.properties?.strokeWidth || 2;
    ctx.setLineDash([5, 5]);

    switch (entity.type) {
      case 'line':
        drawLine(ctx, entity);
        break;
      case 'circle':
        drawCircle(ctx, entity);
        break;
      case 'rectangle':
        drawRectangle(ctx, entity);
        break;
      case 'polyline':
        drawPolyline(ctx, entity);
        break;
      default:
        break;
    }

    ctx.setLineDash([]);
  };

  // Get cursor position in world coordinates
  const getCursorPosition = (e: MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const screenPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    let worldPoint = screenToWorld(screenPoint);

    // Apply grid snapping if enabled
    if (viewState.grid.snap) {
      worldPoint = snapToGrid(worldPoint);
    }

    return worldPoint;
  };

  // Handle mouse events for drawing tools
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    // Middle mouse button (or Ctrl+Left click) for panning
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      return;
    }

    // Left click for drawing or selection
    if (e.button === 0) {
      const cursorPos = getCursorPosition(e);

      // Handle different tools
      switch (currentTool) {
        case 'pointer':
          handleSelectionStart(cursorPos, e);
          break;
        case 'line':
          handleLineStart(cursorPos);
          break;
        case 'circle':
          handleCircleStart(cursorPos);
          break;
        case 'rectangle':
          handleRectangleStart(cursorPos);
          break;
        case 'polyline':
          handlePolylinePoint(cursorPos);
          break;
        case 'text':
          handleTextPlacement(cursorPos);
          break;
        default:
          break;
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    // Handle panning
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;

      setViewState((prev) => ({
        ...prev,
        panOffset: {
          x: prev.panOffset.x + dx,
          y: prev.panOffset.y + dy,
        },
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Handle drawing tools
    if (drawingState.isDrawing) {
      const cursorPos = getCursorPosition(e);

      switch (currentTool) {
        case 'line':
          updateTemporaryLine(cursorPos);
          break;
        case 'circle':
          updateTemporaryCircle(cursorPos);
          break;
        case 'rectangle':
          updateTemporaryRectangle(cursorPos);
          break;
        case 'polyline':
          updateTemporaryPolyline(cursorPos);
          break;
        default:
          break;
      }
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    // End panning
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // Handle drawing completion
    if (drawingState.isDrawing && e.button === 0) {
      const cursorPos = getCursorPosition(e);

      switch (currentTool) {
        case 'line':
          finishLine(cursorPos);
          break;
        case 'circle':
          finishCircle(cursorPos);
          break;
        case 'rectangle':
          finishRectangle(cursorPos);
          break;
        // Note: Polylines are handled differently - they finish on double-click
        default:
          break;
      }
    }
  };

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

  // Selection tool handlers
  const handleSelectionStart = (point: Point, event: MouseEvent) => {
    // Check if clicking on an entity
    let clickedEntityIndex = -1;

    // Loop through entities in reverse order (top-most first)
    for (let i = entities.length - 1; i >= 0; i--) {
      if (isPointOnEntity(point, entities[i])) {
        clickedEntityIndex = i;
        break;
      }
    }

    if (clickedEntityIndex >= 0) {
      const entity = entities[clickedEntityIndex];

      // If shift is not held, clear previous selection
      if (!event.shiftKey) {
        setSelectedEntities([entity.id]);
      } else {
        // Toggle selection if already selected
        if (selectedEntities.includes(entity.id)) {
          setSelectedEntities(
            selectedEntities.filter((id) => id !== entity.id)
          );
        } else {
          setSelectedEntities([...selectedEntities, entity.id]);
        }
      }
    } else {
      // Clicked on empty space, clear selection if shift is not held
      if (!event.shiftKey) {
        setSelectedEntities([]);
      }
    }
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

  // Line tool handlers
  const handleLineStart = (startPoint: Point) => {
    setDrawingState({
      isDrawing: true,
      startPoint,
      points: [],
      temporaryEntity: {
        type: 'line',
        start: startPoint,
        end: startPoint,
        properties: {
          strokeColor: '#3498db',
          strokeWidth: 2,
        },
      },
    });
  };

  const updateTemporaryLine = (currentPoint: Point) => {
    if (!drawingState.startPoint) return;

    setDrawingState((prev) => ({
      ...prev,
      temporaryEntity: {
        ...prev.temporaryEntity,
        end: currentPoint,
      },
    }));
  };

  const finishLine = (endPoint: Point) => {
    if (!drawingState.startPoint) return;

    // Only create line if start and end are different
    if (
      drawingState.startPoint.x !== endPoint.x ||
      drawingState.startPoint.y !== endPoint.y
    ) {
      addEntity({
        type: 'line', // @ts-ignore
        start: drawingState.startPoint,
        end: endPoint,
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

  // Circle tool handlers
  const handleCircleStart = (centerPoint: Point) => {
    setDrawingState({
      isDrawing: true,
      startPoint: centerPoint,
      points: [],
      temporaryEntity: {
        type: 'circle',
        center: centerPoint,
        radius: 0,
        properties: {
          strokeColor: '#3498db',
          strokeWidth: 2,
        },
      },
    });
  };

  const updateTemporaryCircle = (currentPoint: Point) => {
    if (!drawingState.startPoint) return;

    const radius = Math.sqrt(
      Math.pow(currentPoint.x - drawingState.startPoint.x, 2) +
        Math.pow(currentPoint.y - drawingState.startPoint.y, 2)
    );

    setDrawingState((prev) => ({
      ...prev,
      temporaryEntity: {
        ...prev.temporaryEntity,
        radius,
      },
    }));
  };

  const finishCircle = (endPoint: Point) => {
    if (!drawingState.startPoint) return;

    const radius = Math.sqrt(
      Math.pow(endPoint.x - drawingState.startPoint.x, 2) +
        Math.pow(endPoint.y - drawingState.startPoint.y, 2)
    );

    // Only create circle if radius is not zero
    if (radius > 0) {
      addEntity({
        type: 'circle', // @ts-ignore
        center: drawingState.startPoint,
        radius,
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

  // Rectangle tool handlers
  const handleRectangleStart = (startPoint: Point) => {
    setDrawingState({
      isDrawing: true,
      startPoint,
      points: [],
      temporaryEntity: {
        type: 'rectangle',
        topLeft: startPoint,
        width: 0,
        height: 0,
        properties: {
          strokeColor: '#3498db',
          strokeWidth: 2,
        },
      },
    });
  };

  const updateTemporaryRectangle = (currentPoint: Point) => {
    if (!drawingState.startPoint) return;

    const width = currentPoint.x - drawingState.startPoint.x;
    const height = currentPoint.y - drawingState.startPoint.y;

    setDrawingState((prev) => ({
      ...prev,
      temporaryEntity: {
        ...prev.temporaryEntity,
        width,
        height,
      },
    }));
  };

  const finishRectangle = (endPoint: Point) => {
    if (!drawingState.startPoint) return;

    const width = endPoint.x - drawingState.startPoint.x;
    const height = endPoint.y - drawingState.startPoint.y;

    // Only create rectangle if width and height are not zero
    if (width !== 0 && height !== 0) {
      addEntity({
        type: 'rectangle', // @ts-ignore
        topLeft: drawingState.startPoint,
        width,
        height,
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

  // Polyline tool handlers
  const handlePolylinePoint = (point: Point) => {
    if (!drawingState.isDrawing) {
      // Start a new polyline
      setDrawingState({
        isDrawing: true,
        startPoint: point,
        points: [point],
        temporaryEntity: {
          type: 'polyline',
          points: [point],
          properties: {
            strokeColor: '#3498db',
            strokeWidth: 2,
          },
        },
      });
    } else {
      // Add point to existing polyline
      setDrawingState((prev) => ({
        ...prev,
        points: [...prev.points, point],
        temporaryEntity: {
          ...prev.temporaryEntity,
          points: [...prev.points, point],
        },
      }));
    }
  };

  const updateTemporaryPolyline = (currentPoint: Point) => {
    if (!drawingState.isDrawing || drawingState.points.length === 0) return;

    // Update temporary preview line to current mouse position
    const updatedPoints = [...drawingState.points, currentPoint];

    setDrawingState((prev) => ({
      ...prev,
      temporaryEntity: {
        ...prev.temporaryEntity,
        points: updatedPoints,
      },
    }));
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

  // Text tool handler
  // Text tool handler
  const handleTextPlacement = (point: Point) => {
    // Simple implementation - prompt for text content
    const content = prompt('Enter text:', '');

    if (content !== null && content.trim() !== '') {
      addEntity({
        type: 'text',
        position: point,
        content: content,
        fontSize: 16,
        fontFamily: 'Arial', // @ts-ignore
        properties: {
          strokeColor: '#000000',
        },
      });
    }
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right-click
    />
  );
}
