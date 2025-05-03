'use client';

import React, { useState, useRef, useEffect } from 'react';
import { drawGrid } from './draw/draw-grid';
import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { DrawingTool } from '@/types/drawing-tool';
import { drawShape } from './draw/draw-shape';
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
import { handleCanvasClick } from './events/handleCanvasClick';
import { handleMouseMove } from './events/handleMouseMove';
import { handleCanvasDoubleClick } from './events/handleCanvasDoubleClick';
import { handleWheel } from './events/handleWheel';
import { handleMouseDown } from './events/handleMouseDown';

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
            onWheel={(e) =>
              handleWheel({ e, scale, offset, setScale, setOffset })
            }
            onClick={(e) =>
              handleCanvasClick({
                e,
                selectedTool,
                scale,
                offset,
                drawingPoints,
                setDrawingPoints,
                setTempShape,
                tempShape,
                arcAngles,
                ellipseParams,
                splineTension,
                polygonSides,
                completeShape,
                shapes,
                setSelectedShapes,
                snapToGrid,
                gridSize,
              })
            }
            onDoubleClick={(e) =>
              handleCanvasDoubleClick({
                e,
                selectedTool,
                drawingPoints,
                splineTension,
                completeShape,
              })
            }
            onMouseDown={(e) =>
              handleMouseDown({
                e,
                selectedTool,
                scale,
                offset,
                drawingPoints,
                snapToGrid,
                gridSize,
                setIsDragging,
                setDragStart,
                setDrawingPoints,
                setTempShape,
              })
            }
            onMouseMove={(e) =>
              handleMouseMove({
                e,
                selectedTool,
                scale,
                offset,
                isDragging,
                dragStart,
                tempShape,
                drawingPoints,
                arcAngles,
                ellipseParams,
                polygonSides,
                splineTension,
                snapToGrid,
                gridSize,
                setMousePosition,
                setOffset,
                setDragStart,
                setTempShape,
              })
            }
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
