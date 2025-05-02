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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from './ui/slider';

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
    rotation: '',
    tension: '',
  });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [gridSize, setGridSize] = useState(20);
  const [majorGridInterval, setMajorGridInterval] = useState(10);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Dialog states
  const [showPolygonDialog, setShowPolygonDialog] = useState(false);
  const [showArcDialog, setShowArcDialog] = useState(false);
  const [showEllipseDialog, setShowEllipseDialog] = useState(false);
  const [showSplineDialog, setShowSplineDialog] = useState(false);

  // Dialog values
  const [polygonSides, setPolygonSides] = useState(6);
  const [arcAngles, setArcAngles] = useState({
    startAngle: 0,
    endAngle: Math.PI * 1.5,
  });
  const [ellipseParams, setEllipseParams] = useState({
    radiusX: 100,
    radiusY: 60,
    rotation: 0,
    isFullEllipse: true,
  });
  const [splineTension, setSplineTension] = useState(0.5);

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

  // Show appropriate dialog when tool is selected
  useEffect(() => {
    if (selectedTool === 'polygon') {
      setShowPolygonDialog(true);
    } else {
      setShowPolygonDialog(false);
    }

    if (selectedTool === 'arc') {
      setShowArcDialog(true);
    } else {
      setShowArcDialog(false);
    }

    if (selectedTool === 'ellipse') {
      setShowEllipseDialog(true);
    } else {
      setShowEllipseDialog(false);
    }

    if (selectedTool === 'spline') {
      setShowSplineDialog(true);
    } else {
      setShowSplineDialog(false);
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
      rotation: '',
      tension: '',
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
      rotation: '',
      tension: '0.5',
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

  // Handle polygon dialog confirmation
  const handlePolygonDialogConfirm = () => {
    setShowPolygonDialog(false);
    // The dialog values will be used when drawing the polygon
  };

  // Handle arc dialog confirmation
  const handleArcDialogConfirm = () => {
    setShowArcDialog(false);
    // The dialog values will be used when drawing the arc
  };

  // Handle ellipse dialog confirmation
  const handleEllipseDialogConfirm = () => {
    setShowEllipseDialog(false);
    // The dialog values will be used when drawing the ellipse
  };

  // Handle spline dialog confirmation
  const handleSplineDialogConfirm = () => {
    setShowSplineDialog(false);
    // The dialog values will be used when drawing the spline
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
          completeShape([drawingPoints[0], snappedPoint]);
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

        case 'arc':
          if (drawingPoints.length === 1) {
            // Second click determines radius
            const center = drawingPoints[0];
            const dx = snappedPoint.x - center.x;
            const dy = snappedPoint.y - center.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            const angle = angleBetweenPoints(center, snappedPoint);

            setDrawingPoints([...drawingPoints, snappedPoint]);

            // Update temp shape with radius and start angle
            if (tempShape) {
              setTempShape({
                ...tempShape,
                properties: {
                  radius,
                  startAngle: angle,
                  endAngle: angle + arcAngles.endAngle - arcAngles.startAngle,
                },
              });
            }
          } else if (drawingPoints.length === 2) {
            // Third click completes the arc
            const center = drawingPoints[0];
            const angle = angleBetweenPoints(center, snappedPoint);

            completeShape([center], {
              radius: tempShape?.properties?.radius || 0,
              startAngle: tempShape?.properties?.startAngle || 0,
              endAngle: angle,
            });
          }
          break;

        case 'ellipse':
          if (drawingPoints.length === 1) {
            // Second click determines radiusX and sets the direction
            const center = drawingPoints[0];
            const dx = snappedPoint.x - center.x;
            const dy = snappedPoint.y - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = angleBetweenPoints(center, snappedPoint);

            setDrawingPoints([...drawingPoints, snappedPoint]);

            // Update temp shape with first axis
            if (tempShape) {
              setTempShape({
                ...tempShape,
                properties: {
                  radiusX: distance,
                  radiusY:
                    ellipseParams.radiusY * (distance / ellipseParams.radiusX),
                  rotation: angle,
                  isFullEllipse: ellipseParams.isFullEllipse,
                },
              });
            }
          } else if (drawingPoints.length === 2) {
            // Third click determines radiusY
            const center = drawingPoints[0];
            const firstRadius = tempShape?.properties?.radiusX || 0;
            const rotation = tempShape?.properties?.rotation || 0;

            // Calculate perpendicular distance from center to current point
            const dx = snappedPoint.x - center.x;
            const dy = snappedPoint.y - center.y;
            const projectedX =
              dx * Math.cos(rotation) + dy * Math.sin(rotation);
            const projectedY =
              -dx * Math.sin(rotation) + dy * Math.cos(rotation);
            const radiusY = Math.abs(projectedY);

            completeShape([center], {
              radiusX: firstRadius,
              radiusY: radiusY,
              rotation: rotation,
              isFullEllipse: ellipseParams.isFullEllipse,
            });
          }
          break;

        case 'polygon':
          const polygonCenter = drawingPoints[0];
          const polygonDx = snappedPoint.x - polygonCenter.x;
          const polygonDy = snappedPoint.y - polygonCenter.y;
          const polygonRadius = Math.sqrt(
            polygonDx * polygonDx + polygonDy * polygonDy
          );

          completeShape([polygonCenter], {
            radius: polygonRadius,
            sides: parseInt(polygonSides.toString(), 10),
          });
          break;

        case 'spline':
          if (drawingPoints.length >= 2) {
            setDrawingPoints([...drawingPoints, snappedPoint]);

            // Update the temp shape with the new point
            if (tempShape) {
              setTempShape({
                ...tempShape,
                points: [...drawingPoints, snappedPoint],
                properties: { tension: splineTension },
              });
            }

            // Don't complete the shape yet - splines need at least 3 points
            // and can have multiple points, typically completed by double-click
            // or a separate finish action
          } else {
            setDrawingPoints([...drawingPoints, snappedPoint]);

            // Update the temp shape
            if (tempShape) {
              setTempShape({
                ...tempShape,
                points: [...tempShape.points, snappedPoint],
                properties: { tension: splineTension },
              });
            }
          }
          break;

        default:
          completeShape([...drawingPoints, snappedPoint]);
          break;
      }
    }
  };

  // Handle canvas double click (used to complete multi-point shapes like splines)
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'spline' && drawingPoints.length >= 3) {
      // Complete the spline with existing points
      completeShape(drawingPoints, { tension: splineTension });
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

        case 'rectangle':
          setTempShape({
            ...tempShape,
            points: [drawingPoints[0], snappedPoint],
          });
          break;

        case 'circle':
          const circleCenter = drawingPoints[0];
          const dx = snappedPoint.x - circleCenter.x;
          const dy = snappedPoint.y - circleCenter.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          setTempShape({
            ...tempShape,
            properties: { radius },
          });
          break;

        case 'arc':
          if (drawingPoints.length === 1) {
            // Showing radius preview
            const arcCenter = drawingPoints[0];
            const arcDx = snappedPoint.x - arcCenter.x;
            const arcDy = snappedPoint.y - arcCenter.y;
            const arcRadius = Math.sqrt(arcDx * arcDx + arcDy * arcDy);
            const arcAngle = angleBetweenPoints(arcCenter, snappedPoint);

            setTempShape({
              ...tempShape,
              properties: {
                radius: arcRadius,
                startAngle: arcAngle,
                endAngle: arcAngle + arcAngles.endAngle - arcAngles.startAngle,
              },
            });
          } else if (drawingPoints.length === 2) {
            // Showing end angle preview
            const arcCenter = drawingPoints[0];
            const arcAngle = angleBetweenPoints(arcCenter, snappedPoint);

            setTempShape({
              ...tempShape,
              properties: {
                ...tempShape.properties,
                endAngle: arcAngle,
              },
            });
          }
          break;

        case 'ellipse':
          if (drawingPoints.length === 1) {
            // Preview for first axis
            const ellipseCenter = drawingPoints[0];
            const ellipseDx = snappedPoint.x - ellipseCenter.x;
            const ellipseDy = snappedPoint.y - ellipseCenter.y;
            const distance = Math.sqrt(
              ellipseDx * ellipseDx + ellipseDy * ellipseDy
            );
            const angle = angleBetweenPoints(ellipseCenter, snappedPoint);

            setTempShape({
              ...tempShape,
              properties: {
                radiusX: distance,
                radiusY:
                  ellipseParams.radiusY *
                  (distance / ellipseParams.radiusX || 1),
                rotation: angle,
                isFullEllipse: ellipseParams.isFullEllipse,
              },
            });
          } else if (drawingPoints.length === 2) {
            // Preview for second axis
            const ellipseCenter = drawingPoints[0];
            const firstRadius = tempShape.properties?.radiusX || 0;
            const rotation = tempShape.properties?.rotation || 0;

            // Calculate perpendicular distance
            const ellipseDx = snappedPoint.x - ellipseCenter.x;
            const ellipseDy = snappedPoint.y - ellipseCenter.y;
            const projectedX =
              ellipseDx * Math.cos(rotation) + ellipseDy * Math.sin(rotation);
            const projectedY =
              -ellipseDx * Math.sin(rotation) + ellipseDy * Math.cos(rotation);
            const radiusY = Math.abs(projectedY);

            setTempShape({
              ...tempShape,
              properties: {
                ...tempShape.properties,
                radiusY: radiusY,
              },
            });
          }
          break;

        case 'polygon':
          const polygonCenter = drawingPoints[0];
          const polygonDx = snappedPoint.x - polygonCenter.x;
          const polygonDy = snappedPoint.y - polygonCenter.y;
          const polygonRadius = Math.sqrt(
            polygonDx * polygonDx + polygonDy * polygonDy
          );

          setTempShape({
            ...tempShape,
            properties: {
              radius: polygonRadius,
              sides: parseInt(polygonSides.toString(), 10),
            },
          });
          break;

        case 'spline':
          if (drawingPoints.length > 0) {
            setTempShape({
              ...tempShape,
              points: [...drawingPoints, snappedPoint],
              properties: { tension: splineTension },
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
            onDoubleClick={handleCanvasDoubleClick}
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

      {/* Polygon dialog */}
      <Dialog open={showPolygonDialog} onOpenChange={setShowPolygonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Polygon Settings</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='sides' className='text-right'>
                Number of Sides
              </Label>
              <Input
                id='sides'
                type='number'
                min='3'
                max='32'
                value={polygonSides}
                onChange={(e) => setPolygonSides(parseInt(e.target.value, 10))}
                className='col-span-3'
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='submit' onClick={handlePolygonDialogConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Arc dialog */}
      <Dialog open={showArcDialog} onOpenChange={setShowArcDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arc Settings</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='startAngle' className='text-right'>
                Start Angle (degrees)
              </Label>
              <Input
                id='startAngle'
                type='number'
                min='0'
                max='360'
                value={Math.round((arcAngles.startAngle * 180) / Math.PI)}
                onChange={(e) =>
                  setArcAngles((prev) => ({
                    ...prev,
                    startAngle: (parseInt(e.target.value, 10) * Math.PI) / 180,
                  }))
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='endAngle' className='text-right'>
                End Angle (degrees)
              </Label>
              <Input
                id='endAngle'
                type='number'
                min='0'
                max='360'
                value={Math.round((arcAngles.endAngle * 180) / Math.PI)}
                onChange={(e) =>
                  setArcAngles((prev) => ({
                    ...prev,
                    endAngle: (parseInt(e.target.value, 10) * Math.PI) / 180,
                  }))
                }
                className='col-span-3'
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='submit' onClick={handleArcDialogConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ellipse dialog */}
      <Dialog open={showEllipseDialog} onOpenChange={setShowEllipseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ellipse Settings</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='radiusX' className='text-right'>
                X Radius
              </Label>
              <Input
                id='radiusX'
                type='number'
                min='1'
                value={ellipseParams.radiusX}
                onChange={(e) =>
                  setEllipseParams((prev) => ({
                    ...prev,
                    radiusX: parseInt(e.target.value, 10),
                  }))
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='radiusY' className='text-right'>
                Y Radius
              </Label>
              <Input
                id='radiusY'
                type='number'
                min='1'
                value={ellipseParams.radiusY}
                onChange={(e) =>
                  setEllipseParams((prev) => ({
                    ...prev,
                    radiusY: parseInt(e.target.value, 10),
                  }))
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='rotation' className='text-right'>
                Rotation (degrees)
              </Label>
              <Input
                id='rotation'
                type='number'
                min='0'
                max='360'
                value={Math.round((ellipseParams.rotation * 180) / Math.PI)}
                onChange={(e) =>
                  setEllipseParams((prev) => ({
                    ...prev,
                    rotation: (parseInt(e.target.value, 10) * Math.PI) / 180,
                  }))
                }
                className='col-span-3'
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='submit' onClick={handleEllipseDialogConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spline dialog */}
      <Dialog open={showSplineDialog} onOpenChange={setShowSplineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spline Settings</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='tension' className='text-right'>
                Tension
              </Label>
              <div className='col-span-3 flex items-center gap-2'>
                <Slider
                  id='tension'
                  min={0}
                  max={1}
                  step={0.1}
                  value={[splineTension]}
                  onValueChange={(value) => setSplineTension(value[0])}
                />
                <span>{splineTension.toFixed(1)}</span>
              </div>
            </div>
            <p className='text-sm text-muted-foreground'>
              Note: Double-click to complete the spline after adding at least 3
              points.
            </p>
          </div>
          <DialogFooter>
            <Button type='submit' onClick={handleSplineDialogConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
