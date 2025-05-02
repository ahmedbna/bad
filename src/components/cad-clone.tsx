'use client';

import React, { useState, useRef, useEffect } from 'react';
import { drawGrid } from './draw/draw-grid';
import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { DrawingTool } from '@/types/drawing-tool';
import { drawShape } from './draw/draw-shape';
import { worldToCanvas } from '@/utils/worldToCanvas';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { handleSelection } from './selection/handleSelection';
import { SidePanel } from './sidebar/side-panel';
import { Toolbar } from './toolbar/toolbar';
import { useCanvasResize } from '@/hooks/useCanvasResize';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const AutoCADClone = () => {
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('select');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [tempShape, setTempShape] = useState<Shape | null>(null);
  const [coordinateInput, setCoordinateInput] = useState({ x: '', y: '' });
  const [propertyInput, setPropertyInput] = useState({
    length: '',
    width: '',
    height: '',
    radius: '',
    diameter: '',
    radiusX: '',
    radiusY: '',
    startAngle: '',
    endAngle: '',
    sides: '6',
  });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [gridSize, setGridSize] = useState(20);
  const [majorGridInterval, setMajorGridInterval] = useState(10);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // State for polygon dialog
  const [showPolygonDialog, setShowPolygonDialog] = useState(false);
  const [polygonSides, setPolygonSides] = useState(6);

  // Reference to track mouse position
  const [mousePosition, setMousePosition] = useState<Point | null>(null);

  // Refs for canvas and container
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the resize hook to handle DPI scaling
  const dpr = useCanvasResize(canvasRef, containerRef);

  // Set up canvas dimensions and context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the DPI-adjusted canvas dimensions
    const canvasHeight = canvas.height / dpr;

    // Set initial offset to position origin at bottom left
    // This places (0,0) at the bottom-left corner
    const initialOffset = {
      x: 30, // Margin from left edge
      y: canvasHeight - 30, // Position from top (inverted y-axis)
    };

    setOffset(initialOffset);

    const resizeCanvas = () => {
      const displayWidth = canvas.width / dpr;
      const displayHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      drawCanvas();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [dpr]);

  // Show polygon dialog when polygon tool is selected
  useEffect(() => {
    if (selectedTool === 'polygon') {
      setShowPolygonDialog(true);
    } else {
      setShowPolygonDialog(false);
    }
  }, [selectedTool]);

  // Redraw canvas when shapes, temp shape, or view parameters change
  useEffect(() => {
    drawCanvas();
  }, [shapes, tempShape, scale, offset, selectedShapes, gridSize, snapToGrid]);

  // Snap point to grid if enabled
  const snapPointToGrid = (point: Point): Point => {
    if (!snapToGrid) return point;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  };

  // Draw the canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Enable smooth rendering for all shapes
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw grid
    drawGrid({
      canvasRef,
      ctx,
      scale,
      offset,
      gridSize,
      majorGridInterval,
      dpr,
    });

    // Draw all shapes
    shapes.forEach((shape) => {
      const isSelected = selectedShapes.includes(shape.id);
      drawShape({ ctx, scale, offset, shape, isSelected, isTemporary: false });
    });

    // Draw temporary shape while drawing
    if (tempShape) {
      drawShape({
        ctx,
        scale,
        offset,
        shape: tempShape,
        isSelected: false,
        isTemporary: true,
      });
    }
  };

  // Calculate distance between two points
  const distanceBetweenPoints = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate angle between two points (in radians)
  const angleBetweenPoints = (center: Point, p: Point): number => {
    return Math.atan2(p.y - center.y, p.x - center.x);
  };

  // Complete shape and add to shapes list
  const completeShape = (points: Point[], properties = {}) => {
    if (points.length < 1) return;

    const newShape: Shape = {
      id: `shape-${Date.now()}`,
      type: selectedTool,
      points,
      properties,
    };

    setShapes((prev) => [...prev, newShape]);
    setDrawingPoints([]);
    setTempShape(null);
    setCoordinateInput({ x: '', y: '' });
    setPropertyInput({
      length: '',
      width: '',
      height: '',
      radius: '',
      diameter: '',
      radiusX: '',
      radiusY: '',
      startAngle: '',
      endAngle: '',
      sides: '6',
    });
  };

  // Clear drawing and cancel current operation
  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    setTempShape(null);
    setCoordinateInput({ x: '', y: '' });
    setPropertyInput({
      length: '',
      width: '',
      height: '',
      radius: '',
      diameter: '',
      radiusX: '',
      radiusY: '',
      startAngle: '',
      endAngle: '',
      sides: '6',
    });
  };

  // Delete selected shapes
  const handleDeleteShape = () => {
    if (!selectedShapes.length) return;

    setShapes((prev) =>
      prev.filter((shape) => !selectedShapes.includes(shape.id))
    );
    setSelectedShapes([]);
  };

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'select') {
      // Handle selection
      handleSelection({ e, scale, offset, shapes, setSelectedShapes });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldPoint = canvasToWorld({
      point: { x: mouseX, y: mouseY },
      scale,
      offset,
    });
    const snappedPoint = snapPointToGrid(worldPoint);

    if (drawingPoints.length === 0) {
      // First point
      setDrawingPoints([snappedPoint]);

      // Create temporary shape
      const newTempShape: Shape = {
        id: `temp-${Date.now()}`,
        type: selectedTool,
        points: [snappedPoint],
        properties: {},
      };

      setTempShape(newTempShape);
    } else {
      // Complete the shape based on the tool
      switch (selectedTool) {
        case 'line':
        case 'rectangle':
          completeShape([drawingPoints[0], snappedPoint]);
          break;

        case 'circle':
          const center = drawingPoints[0];
          const dx = snappedPoint.x - center.x;
          const dy = snappedPoint.y - center.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          completeShape([center], { radius });
          break;

        case 'polyline':
          // Add point to polyline
          const updatedPoints = [...drawingPoints, snappedPoint];
          setDrawingPoints(updatedPoints);

          if (e.detail === 2) {
            // Double click
            completeShape(updatedPoints);
          } else {
            // Update temp shape with new point
            if (tempShape) {
              setTempShape({
                ...tempShape,
                points: updatedPoints,
              });
            }
          }
          break;

        default:
          break;
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setMousePosition({ x: mouseX, y: mouseY });

    // Handle panning
    if (isDragging) {
      const dx = mouseX - dragStart.x;
      const dy = mouseY - dragStart.y;

      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      setDragStart({ x: mouseX, y: mouseY });
    }

    // Update temporary shape if drawing
    if (tempShape && drawingPoints.length > 0) {
      const worldPoint = canvasToWorld({
        point: { x: mouseX, y: mouseY },
        scale,
        offset,
      });
      const snappedPoint = snapPointToGrid(worldPoint);

      switch (selectedTool) {
        case 'line':
          setTempShape({
            ...tempShape,
            points: [drawingPoints[0], snappedPoint],
          });
          break;

        case 'rectangle':
          setTempShape({
            ...tempShape,
            points: [drawingPoints[0], snappedPoint],
          });
          break;

        case 'circle':
          const center = drawingPoints[0];
          const dx = snappedPoint.x - center.x;
          const dy = snappedPoint.y - center.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          setTempShape({
            ...tempShape,
            properties: { radius },
          });
          break;

        case 'polyline':
          if (drawingPoints.length > 0) {
            const newPoints = [...drawingPoints];
            if (newPoints.length > 1) {
              // Replace the last preview point
              newPoints[newPoints.length - 1] = snappedPoint;
            } else {
              // Add a preview point
              newPoints.push(snappedPoint);
            }

            setTempShape({
              ...tempShape,
              points: newPoints,
            });
          }
          break;

        default:
          break;
      }
    }
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
    const snappedPoint = snapPointToGrid(worldPoint);

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

  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Smoother zoom factor
    const zoomIntensity = 0.05;
    const direction = e.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1 + direction * zoomIntensity;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get world position under cursor before zoom
    const worldPointBeforeZoom = canvasToWorld({
      point: { x: mouseX, y: mouseY },
      scale,
      offset,
    });

    // New scale
    const newScale = scale * zoomFactor;
    setScale(newScale);

    // Get screen position of same world point after zoom
    const newScreenPoint = worldToCanvas({
      point: worldPointBeforeZoom,
      scale: newScale,
      offset,
    });

    // Adjust offset so zoom centers around the cursor
    setOffset((prev) => ({
      x: prev.x + (mouseX - newScreenPoint.x),
      y: prev.y + (mouseY - newScreenPoint.y),
    }));
  };

  return (
    <div className='flex flex-col h-screen'>
      {/* Top toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        canvasRef={canvasRef}
        gridSize={gridSize}
        setSelectedShapes={setSelectedShapes}
        selectedShapes={selectedShapes}
        setSnapToGrid={setSnapToGrid}
        snapToGrid={snapToGrid}
        setGridSize={setGridSize}
        setScale={setScale}
        setOffset={setOffset}
        handleDeleteShape={handleDeleteShape}
      />

      {/* Main content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Drawing canvas */}
        <div
          className='flex-1 relative overflow-hidden flex items-center justify-center '
          ref={containerRef}
        >
          <canvas
            ref={canvasRef}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            className='cursor-crosshair bg-muted rounded-xl border shadow-sm'
          />
        </div>

        {/* Side panel */}
        <SidePanel
          scale={scale}
          offset={offset}
          shapes={shapes}
          selectedTool={selectedTool}
          drawingPoints={drawingPoints}
          coordinateInput={coordinateInput}
          tempShape={tempShape}
          setDrawingPoints={setDrawingPoints}
          setTempShape={setTempShape}
          setCoordinateInput={setCoordinateInput}
          setPropertyInput={setPropertyInput}
          propertyInput={propertyInput}
          selectedShapes={selectedShapes}
          mousePosition={mousePosition}
          handleCancelDrawing={handleCancelDrawing}
          completeShape={completeShape}
        />
      </div>
    </div>
  );
};
