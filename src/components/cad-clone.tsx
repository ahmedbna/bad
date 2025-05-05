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
import { handleCanvasClick } from './events/handleCanvasClick';
import { handleMouseMove } from './events/handleMouseMove';
import { handleCanvasDoubleClick } from './events/handleCanvasDoubleClick';
import { handleWheel } from './events/handleWheel';
import { handleMouseDown } from './events/handleMouseDown';
import {
  renderAreaSelection,
  createInitialAreaSelectionState,
} from './events/handleAreaSelection';
import { handleMouseUp } from './events/handleMouseUp';
import { ArcMode } from '@/types/arc-mode';
import { ArcModeDialog } from '@/components/dialogs/arc-mode-dialog';
import { useSnapping, SnapMode } from '@/components/snap/useSnapping';
import { renderSnapIndicator } from '@/components/draw/renderSnapIndicator';
import { PolygonDialog } from '@/components/dialogs/polygon-dialog';
import { EllipseDialog } from './dialogs/ellipse-dialog';
import { SplineDialog } from './dialogs/spline-dialog';

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
    direction: '',
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
  const [areaSelection, setAreaSelection] = useState(
    createInitialAreaSelectionState()
  );

  const [gridSize, setGridSize] = useState(20);
  const [majorGridInterval, setMajorGridInterval] = useState(10);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Snapping configuration
  const [snapSettings, setSnapSettings] = useState({
    enabled: true,
    modes: new Set([
      SnapMode.ENDPOINT,
      SnapMode.MIDPOINT,
      SnapMode.CENTER,
      SnapMode.QUADRANT,
    ]),
    threshold: 10,
    gridSize: gridSize,
  });

  // Update snap settings when grid size changes
  useEffect(() => {
    setSnapSettings((prev) => ({
      ...prev,
      gridSize: gridSize,
    }));
  }, [gridSize]);

  // Initialize snapping hook
  const { activeSnapResult, handleCursorMove, clearSnap } = useSnapping({
    shapes,
    snapSettings,
    scale,
    offset,
  });

  // Dialog states
  const [showPolygonDialog, setShowPolygonDialog] = useState(false);
  const [showArcDialog, setShowArcDialog] = useState(false);
  const [showEllipseDialog, setShowEllipseDialog] = useState(false);
  const [showSplineDialog, setShowSplineDialog] = useState(false);

  // Dialog values
  const [polygonSides, setPolygonSides] = useState(6);

  const [arcMode, setArcMode] = useState<ArcMode>('ThreePoint');
  const [showArcMode, setShowArcMode] = useState(false);
  // Drawing state for arcs
  const [arcAngles, setArcAngles] = useState<{
    startAngle: number;
    endAngle: number;
  }>({
    startAngle: 0,
    endAngle: Math.PI * 2,
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
  }, [
    shapes,
    tempShape,
    scale,
    offset,
    selectedShapes,
    areaSelection,
    gridSize,
    snapToGrid,
    activeSnapResult,
  ]);

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
      drawShape({
        ctx,
        scale,
        offset,
        shape,
        isSelected,
        isTemporary: false,
      });
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

    // Draw area selection if active
    renderAreaSelection(ctx, areaSelection, scale, offset);

    // Draw snap indicator if active
    if (snapSettings.enabled && activeSnapResult) {
      renderSnapIndicator(ctx, activeSnapResult, scale, offset);
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
      isCompleted: true,
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
      direction: '',
      radiusX: '',
      radiusY: '',
      startAngle: '',
      endAngle: '',
      sides: '6',
      rotation: '',
      tension: '',
    });
    clearSnap();
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
      direction: '',
      radiusX: '',
      radiusY: '',
      startAngle: '',
      endAngle: '',
      sides: '6',
      rotation: '',
      tension: '0.5',
    });
    clearSnap();
  };

  // Delete selected shapes
  const handleDeleteShape = () => {
    if (!selectedShapes.length) return;

    setShapes((prev) =>
      prev.filter((shape) => !selectedShapes.includes(shape.id))
    );
    setSelectedShapes([]);
  };

  // Toggle snap mode
  const toggleSnapMode = (mode: SnapMode) => {
    setSnapSettings((prev) => {
      const newModes = new Set(prev.modes);
      if (newModes.has(mode)) {
        newModes.delete(mode);
      } else {
        newModes.add(mode);
      }
      return {
        ...prev,
        modes: newModes,
      };
    });
  };

  // Toggle snapping on/off
  const toggleSnapping = () => {
    setSnapSettings((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  // Update snap threshold
  const updateSnapThreshold = (value: number) => {
    setSnapSettings((prev) => ({
      ...prev,
      threshold: value,
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
        setShowArcMode={setShowArcMode}
        snapSettings={snapSettings}
        toggleSnapMode={toggleSnapMode}
        toggleSnapping={toggleSnapping}
        updateSnapThreshold={updateSnapThreshold}
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
                arcMode,
                snapEnabled: snapSettings.enabled,
                activeSnapResult,
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
                setAreaSelection,
                snapEnabled: snapSettings.enabled,
                activeSnapResult,
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
                areaSelection,
                setAreaSelection,
                arcMode,
                snapEnabled: snapSettings.enabled,
                handleCursorMove,
              })
            }
            onMouseUp={(e) =>
              handleMouseUp({
                e,
                areaSelection,
                shapes,
                setAreaSelection,
                setSelectedShapes,
                setIsDragging,
              })
            }
            onMouseLeave={() => {
              setIsDragging(false);
              clearSnap();
            }}
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
          activeSnapResult={activeSnapResult}
          snapSettings={snapSettings}
          toggleSnapMode={toggleSnapMode}
        />
      </div>

      <PolygonDialog
        polygonSides={polygonSides}
        showPolygonDialog={showPolygonDialog}
        setPolygonSides={setPolygonSides}
        setShowPolygonDialog={setShowPolygonDialog}
      />

      <EllipseDialog
        showEllipseDialog={showEllipseDialog}
        setShowEllipseDialog={setShowEllipseDialog}
        ellipseParams={ellipseParams}
        setEllipseParams={setEllipseParams}
      />

      <SplineDialog
        showSplineDialog={showSplineDialog}
        setShowSplineDialog={setShowSplineDialog}
        splineTension={splineTension}
        setSplineTension={setSplineTension}
      />

      <ArcModeDialog
        setArcMode={setArcMode}
        showArcMode={showArcMode}
        setShowArcMode={setShowArcMode}
      />
    </div>
  );
};
