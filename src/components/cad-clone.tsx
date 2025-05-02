'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Circle,
  Square,
  Minus,
  Slash,
  Hand,
  LucideBoxSelect,
} from 'lucide-react';
import { ModeToggle } from './ui/mode-toggle';
import { drawGrid, initializeCanvas } from './draw/draw-grid';
import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { DrawingTool } from '@/types/drawing-tool';
import { drawShape } from './draw/draw-shape';
import { worldToCanvas } from '@/utils/worldToCanvas';
import { canvasToWorld } from '@/utils/canvasToWorld';

export const AutoCADClone = () => {
  // State
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
  });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(20);
  const [majorGridInterval, setMajorGridInterval] = useState(10);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Reference to track mouse position
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  // Refs

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize canvas on mount
  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawCanvas();
    }

    // Set up event listeners for resize
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        drawCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw canvas when shapes, temp shape, or view parameters change
  useEffect(() => {
    drawCanvas();
  }, [shapes, tempShape, scale, offset, selectedShape, gridSize, snapToGrid]);

  useEffect(() => {
    initializeCanvas(canvasRef, setOffset);
  }, [canvasRef]);

  // // Use the resize hook to handle DPI scaling
  // const dpr = useCanvasResize(canvasRef);

  // // Initialize the canvas on component mount
  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const ctx = canvas.getContext('2d');
  //   if (!ctx) return;

  //   const resizeCanvas = () => {
  //     // Clear canvas with device pixel ratio in mind
  //     const displayWidth = canvas.width / dpr;
  //     const displayHeight = canvas.height / dpr;

  //     ctx.clearRect(0, 0, displayWidth, displayHeight);
  //     // const { width, height } = canvas.getBoundingClientRect();
  //     // canvas.width = width;
  //     // canvas.height = height;

  //     drawCanvas();
  //   };

  //   // Set up event listeners
  //   window.addEventListener('resize', resizeCanvas);
  //   resizeCanvas();

  //   return () => {
  //     window.removeEventListener('resize', resizeCanvas);
  //   };
  // }, []);

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid({
      canvasRef,
      ctx,
      scale,
      offset,
      gridSize,
      majorGridInterval,
    });

    // Draw all shapes
    shapes.forEach((shape) => {
      const isSelected = shape.id === selectedShape;
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

    // Draw crosshair at cursor
    // if (selectedTool !== 'select') {
    //   drawCrosshair({ ctx, scale, offset, mousePosition, selectedTool });
    // }
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

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'select') {
      // Handle selection
      handleSelection(e);
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
    });
  };

  // Handle selection
  const handleSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldPoint = canvasToWorld({
      point: { x: mouseX, y: mouseY },
      scale,
      offset,
    });

    // Find clicked shape
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];

      if (isPointInShape(worldPoint, shape)) {
        setSelectedShape(shape.id);
        return;
      }
    }

    // If no shape found, clear selection
    setSelectedShape(null);
  };

  // Check if point is in shape
  const isPointInShape = (point: Point, shape: Shape): boolean => {
    switch (shape.type) {
      case 'line':
        if (shape.points.length < 2) return false;
        return isPointOnLine(point, shape.points[0], shape.points[1]);

      case 'rectangle':
        if (shape.points.length < 2) return false;
        return isPointInRectangle(point, shape.points[0], shape.points[1]);

      case 'circle':
        if (shape.points.length < 1 || !shape.properties?.radius) return false;
        return isPointInCircle(point, shape.points[0], shape.properties.radius);

      case 'polyline':
        if (shape.points.length < 2) return false;
        return isPointOnPolyline(point, shape.points);

      default:
        return false;
    }
  };

  // Check if point is on line
  const isPointOnLine = (
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): boolean => {
    const tolerance = 5 / scale; // 5px in screen coordinates

    const d1 = distance(point, lineStart);
    const d2 = distance(point, lineEnd);
    const lineLength = distance(lineStart, lineEnd);

    // Check if point is close to line segment
    return Math.abs(d1 + d2 - lineLength) < tolerance;
  };

  // Check if point is in rectangle
  const isPointInRectangle = (
    point: Point,
    rectStart: Point,
    rectEnd: Point
  ): boolean => {
    const tolerance = 5 / scale; // 5px in screen coordinates

    const minX = Math.min(rectStart.x, rectEnd.x);
    const maxX = Math.max(rectStart.x, rectEnd.x);
    const minY = Math.min(rectStart.y, rectEnd.y);
    const maxY = Math.max(rectStart.y, rectEnd.y);

    // Check if point is inside rectangle
    if (
      point.x >= minX &&
      point.x <= maxX &&
      point.y >= minY &&
      point.y <= maxY
    ) {
      return true;
    }

    // Check if point is close to rectangle edges
    if (
      (Math.abs(point.x - minX) < tolerance ||
        Math.abs(point.x - maxX) < tolerance) &&
      point.y >= minY &&
      point.y <= maxY
    ) {
      return true;
    }

    if (
      (Math.abs(point.y - minY) < tolerance ||
        Math.abs(point.y - maxY) < tolerance) &&
      point.x >= minX &&
      point.x <= maxX
    ) {
      return true;
    }

    return false;
  };

  // Check if point is in circle
  const isPointInCircle = (
    point: Point,
    center: Point,
    radius: number
  ): boolean => {
    const tolerance = 5 / scale; // 5px in screen coordinates
    const d = distance(point, center);

    return Math.abs(d - radius) < tolerance;
  };

  // Check if point is on polyline
  const isPointOnPolyline = (
    point: Point,
    polylinePoints: Point[]
  ): boolean => {
    if (polylinePoints.length < 2) return false;

    // Check each segment of the polyline
    for (let i = 0; i < polylinePoints.length - 1; i++) {
      if (isPointOnLine(point, polylinePoints[i], polylinePoints[i + 1])) {
        return true;
      }
    }

    return false;
  };

  // Calculate distance between two points
  const distance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
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

  // Handle coordinate input
  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (coordinateInput.x === '' || coordinateInput.y === '') return;

    const point = {
      x: parseFloat(coordinateInput.x),
      y: parseFloat(coordinateInput.y),
    };

    if (isNaN(point.x) || isNaN(point.y)) return;

    // Use the input coordinates as a point
    if (drawingPoints.length === 0) {
      // First point
      setDrawingPoints([point]);

      // Create temporary shape
      const newTempShape: Shape = {
        id: `temp-${Date.now()}`,
        type: selectedTool,
        points: [point],
        properties: {},
      };

      setTempShape(newTempShape);
    } else {
      // Complete shapes based on the tool
      switch (selectedTool) {
        case 'line':
        case 'rectangle':
          completeShape([drawingPoints[0], point]);
          break;

        case 'circle':
          // For circle, the second point just helps compute radius
          const center = drawingPoints[0];
          const dx = point.x - center.x;
          const dy = point.y - center.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          completeShape([center], { radius });
          break;

        case 'polyline':
          // Add point to polyline
          const updatedPoints = [...drawingPoints, point];
          setDrawingPoints(updatedPoints);

          // Update temp shape with new point
          if (tempShape) {
            setTempShape({
              ...tempShape,
              points: updatedPoints,
            });
          }
          break;

        default:
          break;
      }
    }
  };

  // Handle property input
  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (drawingPoints.length === 0) return;

    switch (selectedTool) {
      case 'line':
        if (propertyInput.length === '') return;

        const length = parseFloat(propertyInput.length);
        if (isNaN(length)) return;

        // Calculate second point based on first point and length
        // Assuming horizontal line for simplicity
        const lineEnd = {
          x: drawingPoints[0].x + length,
          y: drawingPoints[0].y,
        };

        completeShape([drawingPoints[0], lineEnd]);
        break;

      case 'rectangle':
        if (propertyInput.width === '' || propertyInput.height === '') return;

        const width = parseFloat(propertyInput.width);
        const height = parseFloat(propertyInput.height);

        if (isNaN(width) || isNaN(height)) return;

        // Calculate second point based on first point, width, and height
        const rectEnd = {
          x: drawingPoints[0].x + width,
          y: drawingPoints[0].y + height,
        };

        completeShape([drawingPoints[0], rectEnd]);
        break;

      case 'circle':
        let radius = 0;

        if (propertyInput.radius !== '') {
          radius = parseFloat(propertyInput.radius);
        } else if (propertyInput.diameter !== '') {
          radius = parseFloat(propertyInput.diameter) / 2;
        } else {
          return;
        }

        if (isNaN(radius)) return;

        completeShape([drawingPoints[0]], { radius });
        break;

      default:
        break;
    }
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
    });
  };

  // Delete selected shape
  const handleDeleteShape = () => {
    if (!selectedShape) return;

    setShapes((prev) => prev.filter((shape) => shape.id !== selectedShape));
    setSelectedShape(null);
  };

  console.log('shapes:', shapes);

  return (
    <div className='flex flex-col h-screen'>
      {/* Top toolbar */}
      <div className='p-2 border-b flex items-center space-x-4'>
        <div className='flex space-x-2'>
          <ModeToggle />

          <Button
            variant={selectedTool === 'select' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedTool('select')}
            title='Select'
          >
            <LucideBoxSelect size={16} />
          </Button>
          <Button
            variant={selectedTool === 'pan' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedTool('pan')}
            title='Pan'
          >
            <Hand size={16} />
          </Button>
          <Button
            variant={selectedTool === 'line' ? 'default' : 'outline'}
            size='sm'
            onClick={() => {
              setSelectedTool('line');
              setSelectedShape(null);
            }}
            title='Line'
          >
            <Minus size={16} />
          </Button>
          <Button
            variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
            size='sm'
            onClick={() => {
              setSelectedTool('rectangle');
              setSelectedShape(null);
            }}
            title='Rectangle'
          >
            <Square size={16} />
          </Button>
          <Button
            variant={selectedTool === 'circle' ? 'default' : 'outline'}
            size='sm'
            onClick={() => {
              setSelectedTool('circle');
              setSelectedShape(null);
            }}
            title='Circle'
          >
            <Circle size={16} />
          </Button>
          <Button
            variant={selectedTool === 'polyline' ? 'default' : 'outline'}
            size='sm'
            onClick={() => {
              setSelectedTool('polyline');
              setSelectedShape(null);
            }}
            title='Polyline'
          >
            <Slash size={16} />
          </Button>
        </div>

        <Separator orientation='vertical' className='h-8' />

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setSnapToGrid(!snapToGrid)}
            title={snapToGrid ? 'Snap On' : 'Snap Off'}
          >
            {snapToGrid ? 'Snap: On' : 'Snap: Off'}
          </Button>

          <Select
            value={gridSize.toString()}
            onValueChange={(val) => setGridSize(parseInt(val))}
          >
            <SelectTrigger className='w-24'>
              <SelectValue placeholder='Grid Size' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='5'>5 units</SelectItem>
              <SelectItem value='10'>10 units</SelectItem>
              <SelectItem value='20'>20 units</SelectItem>
              <SelectItem value='50'>50 units</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation='vertical' className='h-8' />

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setScale(1);
              setOffset({
                x: canvasRef.current?.width ?? 0 / 2,
                y: canvasRef.current?.height ?? 0 / 2,
              });
            }}
          >
            Reset View
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setScale((prev) => prev * 1.2)}
          >
            Zoom In
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setScale((prev) => prev * 0.8)}
          >
            Zoom Out
          </Button>
        </div>

        {selectedShape && (
          <>
            <Separator orientation='vertical' className='h-8' />
            <Button variant='destructive' size='sm' onClick={handleDeleteShape}>
              Delete Selected
            </Button>
          </>
        )}
      </div>

      {/* Main content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Drawing canvas */}
        <div className='flex-1 relative overflow-hidden' ref={containerRef}>
          <canvas
            ref={canvasRef}
            className='absolute top-0 left-0 cursor-crosshair bg-muted'
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
            onMouseDown={(e) => {
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
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onWheel={handleWheel}
          />
        </div>

        {/* Side panel */}
        <div className='w-64 border-l p-4 overflow-y-auto'>
          <h3 className='font-semibold mb-4'>Properties</h3>

          {/* Coordinate input */}
          {selectedTool !== 'select' && (
            <Card className='mb-4'>
              <CardHeader className='py-2'>
                <CardTitle className='text-sm'>Coordinates</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCoordinateSubmit} className='space-y-2'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='flex flex-col space-y-1'>
                      <Label htmlFor='coord-x' className='text-xs'>
                        X:
                      </Label>
                      <Input
                        id='coord-x'
                        value={coordinateInput.x}
                        onChange={(e) =>
                          setCoordinateInput((prev) => ({
                            ...prev,
                            x: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className='flex flex-col space-y-1'>
                      <Label htmlFor='coord-y' className='text-xs'>
                        Y:
                      </Label>
                      <Input
                        id='coord-y'
                        value={coordinateInput.y}
                        onChange={(e) =>
                          setCoordinateInput((prev) => ({
                            ...prev,
                            y: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button type='submit' size='sm' className='w-full'>
                    Set Point
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Tool-specific properties */}
          {selectedTool !== 'select' && drawingPoints.length > 0 && (
            <Card className='mb-4'>
              <CardHeader className='py-2'>
                <CardTitle className='text-sm'>
                  {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}{' '}
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePropertySubmit} className='space-y-2'>
                  {selectedTool === 'line' && (
                    <div className='flex flex-col space-y-1'>
                      <Label htmlFor='prop-length' className='text-xs'>
                        Length:
                      </Label>
                      <Input
                        id='prop-length'
                        value={propertyInput.length}
                        onChange={(e) =>
                          setPropertyInput((prev) => ({
                            ...prev,
                            length: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {selectedTool === 'rectangle' && (
                    <>
                      <div className='flex flex-col space-y-1'>
                        <Label htmlFor='prop-width' className='text-xs'>
                          Width:
                        </Label>
                        <Input
                          id='prop-width'
                          value={propertyInput.width}
                          onChange={(e) =>
                            setPropertyInput((prev) => ({
                              ...prev,
                              width: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className='flex flex-col space-y-1'>
                        <Label htmlFor='prop-height' className='text-xs'>
                          Height:
                        </Label>
                        <Input
                          id='prop-height'
                          value={propertyInput.height}
                          onChange={(e) =>
                            setPropertyInput((prev) => ({
                              ...prev,
                              height: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </>
                  )}

                  {selectedTool === 'circle' && (
                    <Tabs defaultValue='radius'>
                      <TabsList className='w-full grid grid-cols-2'>
                        <TabsTrigger value='radius'>Radius</TabsTrigger>
                        <TabsTrigger value='diameter'>Diameter</TabsTrigger>
                      </TabsList>
                      <TabsContent value='radius'>
                        <div className='flex flex-col space-y-1'>
                          <Label htmlFor='prop-radius' className='text-xs'>
                            Radius:
                          </Label>
                          <Input
                            id='prop-radius'
                            value={propertyInput.radius}
                            onChange={(e) =>
                              setPropertyInput((prev) => ({
                                ...prev,
                                radius: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value='diameter'>
                        <div className='flex flex-col space-y-1'>
                          <Label htmlFor='prop-diameter' className='text-xs'>
                            Diameter:
                          </Label>
                          <Input
                            id='prop-diameter'
                            value={propertyInput.diameter}
                            onChange={(e) =>
                              setPropertyInput((prev) => ({
                                ...prev,
                                diameter: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}

                  {selectedTool === 'polyline' && (
                    <div className='text-xs'>
                      Points: {drawingPoints.length}
                      <p className='mt-1 text-gray-500'>
                        Double-click to finish polyline
                      </p>
                    </div>
                  )}

                  <div className='flex space-x-2 pt-1'>
                    <Button type='submit' size='sm' className='flex-1'>
                      Apply
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={handleCancelDrawing}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Selected shape properties */}
          {selectedTool === 'select' && selectedShape && (
            <Card className='mb-4'>
              <CardHeader className='py-2'>
                <CardTitle className='text-sm'>Selected Shape</CardTitle>
              </CardHeader>
              <CardContent>
                {shapes.find((s) => s.id === selectedShape)?.type && (
                  <div className='text-sm space-y-2'>
                    <div>
                      <span className='font-medium'>Type:</span>{' '}
                      {shapes.find((s) => s.id === selectedShape)?.type}
                    </div>

                    {shapes.find((s) => s.id === selectedShape)?.points && (
                      <div>
                        <span className='font-medium'>Points:</span>
                        <div className='pl-2 text-xs'>
                          {shapes
                            .find((s) => s.id === selectedShape)
                            ?.points.map((point, index) => (
                              <div key={index}>
                                Point {index + 1}: ({point.x.toFixed(2)},{' '}
                                {point.y.toFixed(2)})
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {shapes.find((s) => s.id === selectedShape)?.properties
                      ?.radius && (
                      <div>
                        <span className='font-medium'>Radius:</span>{' '}
                        {shapes
                          .find((s) => s.id === selectedShape)
                          ?.properties?.radius?.toFixed(2) ?? 'N/A'}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status and information */}
          <Card>
            <CardHeader className='py-2'>
              <CardTitle className='text-sm'>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xs space-y-1'>
                <div>
                  <span className='font-medium'>Active Tool:</span>{' '}
                  {selectedTool}
                </div>
                <div>
                  <span className='font-medium'>Cursor:</span>{' '}
                  {mousePosition
                    ? `(${canvasToWorld({ point: mousePosition, scale, offset }).x.toFixed(2)}, ${canvasToWorld({ point: mousePosition, scale, offset }).y.toFixed(2)})`
                    : 'N/A'}
                </div>
                <div>
                  <span className='font-medium'>Zoom:</span>{' '}
                  {(scale * 100).toFixed(0)}%
                </div>
                <div>
                  <span className='font-medium'>Shapes:</span> {shapes.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
