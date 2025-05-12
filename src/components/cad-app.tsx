'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { drawGrid } from './draw/draw-grid';
import { Point } from '@/types';
import { DrawingTool, ArcMode } from '@/constants';
import { drawShape } from './draw/draw-shape';
import { SidePanel } from './sidebar/side-panel';
import { useCanvasResize } from '@/hooks/useCanvasResize';
import { handleCanvasClick } from './events/handleCanvasClick';
import { handleMouseMove } from './events/handleMouseMove';
import { handleCanvasDoubleClick } from './events/handleCanvasDoubleClick';
import { handleWheel } from './events/handleWheel';
import { handleMouseDown } from './events/handleMouseDown';
import {
  renderAreaSelection,
  createInitialAreaSelectionState,
  startAreaSelection,
} from './select/handleAreaSelection';
import { handleMouseUp } from './events/handleMouseUp';
import { ArcModeDialog } from '@/components/dialogs/arc-mode-dialog';
import { useSnapping, SnapMode } from '@/components/snap/useSnapping';
import { renderSnapIndicator } from '@/components/snap/renderSnapIndicator';
import { PolygonDialog } from '@/components/dialogs/polygon-dialog';
import { EllipseDialog } from './dialogs/ellipse-dialog';
import { SplineDialog } from './dialogs/spline-dialog';
import { TextDialog } from './dialogs/text-dialog';
import { DimensionDialog } from './dialogs/dimension-dialog';
import { PolarTrackingDialog } from './dialogs/polar-tracking-dialog';
import { drawPolarTrackingLines } from './polar/polar-tracking';
import { useEditing } from '@/components/editing/useEditing';
import { createInitialEditingState, EditingTool } from './editing/constants';
import { renderEditingVisuals } from './editing/render-editing';
import { handleSelection } from './select/handleSelection';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CollaboratorCursor } from './collaboration/collaborator-cursor';
import { useDebounce } from '@/hooks/useDebounce';
import { useThrottledFunction } from '@/hooks/useThrottledFunction';
import {
  Collaborators,
  getCollaboratorName,
  getUserColor,
} from './collaboration/collaborators';

type Props = {
  projectId: Id<'projects'>;
  shapes: Array<Doc<'shapes'>>;
  activeUsers: {
    user: {
      _id: Id<'users'>;
      name: string | undefined;
      email: string | undefined;
      image: string | undefined;
    } | null;
    isSelf: boolean;
    _id: Id<'presence'>;
    _creationTime: number;
    tool?: string | undefined;
    viewport?:
      | {
          x: number;
          y: number;
          scale: number;
        }
      | undefined;
    userId: Id<'users'>;
    projectId: Id<'projects'>;
    x: number;
    y: number;
    lastUpdated: number;
  }[];
  collaborators: Array<
    Doc<'collaborators'> & {
      user: {
        _id: Id<'users'>;
        name: string | undefined;
        email: string | undefined;
        image: string | undefined;
      } | null;
    }
  >;
  currentUser: Doc<'users'>;
};

export const CADApp = ({
  projectId,
  shapes,
  activeUsers,
  collaborators,
  currentUser,
}: Props) => {
  const createShape = useMutation(api.shapes.create);
  const deleteShapes = useMutation(api.shapes.deleteShapes);

  // Collaboration-specific mutations and queries
  const updatePresence = useMutation(api.presence.updatePresence);
  const leaveProject = useMutation(api.presence.leaveProject);

  const [selectedTool, setSelectedTool] = useState<DrawingTool>('select');
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [tempShape, setTempShape] = useState<Doc<'shapes'> | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<Id<'shapes'>[]>([]);

  const [selectedTab, setSelectedTab] = useState('tools');
  const [editingTextId, setEditingTextId] = useState<Id<'shapes'> | null>(null);

  const [textParams, setTextParams] = useState({
    content: 'Sample Text',
    fontSize: 24,
    fontFamily: 'Arial',
    fontStyle: 'normal',
    fontWeight: 'normal',
    rotation: 0,
    justification: 'center' as 'left' | 'center' | 'right',
  });

  const [dimensionParams, setDimensionParams] = useState({
    dimensionType: 'linear' as 'linear' | 'angular' | 'radius' | 'diameter',
    offset: 25,
    extensionLineOffset: 5,
    arrowSize: 8,
    textHeight: 12,
    precision: 2,
    units: '',
    showValue: true,
    textRotation: 0,
    value: 0,
  });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [areaSelection, setAreaSelection] = useState(
    createInitialAreaSelectionState()
  );

  const [majorGridInterval, setMajorGridInterval] = useState(10);
  const [gridSize, setGridSize] = useState(10);

  // Snapping configuration
  const [snapSettings, setSnapSettings] = useState({
    enabled: true,
    modes: new Set([
      SnapMode.ENDPOINT,
      SnapMode.MIDPOINT,
      SnapMode.CENTER,
      SnapMode.QUADRANT,
    ]),
    threshold: 25,
    gridSize: 10,
  });

  // Initialize snapping hook
  const { activeSnapResult, handleCursorMove, clearSnap } = useSnapping({
    shapes,
    snapSettings,
    scale,
    offset,
  });

  const {
    editingState,
    setEditingState,
    setEditingTool,
    handleEditingClick,
    statusMessage,
    commandBuffer,
    handleUndo,
    handleRedo,
  } = useEditing(scale, offset, shapes, selectedShapeIds);

  // Dialog states
  const [showPolygonDialog, setShowPolygonDialog] = useState(false);
  const [showEllipseDialog, setShowEllipseDialog] = useState(false);
  const [showSplineDialog, setShowSplineDialog] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showDimensionDialog, setShowDimensionDialog] = useState(false);
  const [showCollabsDialog, setShowCollabsDialog] = useState(false);
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
  const [mousePosition, setMousePosition] = useState<Point>({
    x: 200,
    y: 200,
  });

  const [polarSettings, setPolarSettings] = useState({
    enabled: false,
    angleIncrement: 45, // Default 45 degrees
    angles: [0, 45, 90, 135, 180, 225, 270, 315], // Default angles
    snapThreshold: 100, // Snap threshold in pixels
    trackingLines: true, // Show tracking lines
  });
  const [showPolarDialog, setShowPolarDialog] = useState(false);

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

  // Redraw canvas when shapes, temp shape, or view parameters change
  useEffect(() => {
    drawCanvas();
  }, [
    shapes,
    tempShape,
    scale,
    offset,
    selectedShapeIds,
    areaSelection,
    gridSize,
    activeSnapResult,
    textParams,
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
      const isSelected = selectedShapeIds.includes(shape._id);
      drawShape({
        ctx,
        scale,
        offset,
        shape,
        isSelected,
        isTemporary: false,
        editingState,
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
        editingState,
      });
    }

    // Draw area selection if active
    renderAreaSelection(ctx, areaSelection, scale, offset);

    // Draw snap indicator if active
    if (snapSettings.enabled && activeSnapResult) {
      renderSnapIndicator(ctx, activeSnapResult, scale, offset);
    }

    renderEditingVisuals(ctx, editingState, scale, offset);

    if (
      drawingPoints &&
      drawingPoints.length > 0 &&
      polarSettings.enabled &&
      polarSettings.trackingLines &&
      mousePosition
    ) {
      drawPolarTrackingLines({
        dpr,
        ctx,
        scale,
        offset,
        mousePosition,
        angles: polarSettings.angles,
        originPoint: drawingPoints[0],
      });
    }
  };

  // Complete shape and add to shapes list
  const completeShape = async (points: Point[], properties: {}) => {
    if (points.length < 1) return;

    createShape({
      projectId,
      type: selectedTool,
      points,
      properties,
    });

    setDrawingPoints([]);
    setTempShape(null);

    clearSnap();
  };

  // Tracking our view position for collaboration
  const debouncedMousePosition = useDebounce(mousePosition, 20);
  const debouncedViewport = useDebounce(
    { x: offset.x, y: offset.y, scale },
    500
  );

  // Handle cursor movement for collaboration
  const handleMoveCursor = useThrottledFunction((x: number, y: number) => {
    if (!projectId || !currentUser) return;

    // Send cursor position to server
    updatePresence({
      projectId,
      x,
      y,
      tool: selectedTool,
      viewport: {
        x: offset.x,
        y: offset.y,
        scale: scale,
      },
    }).catch((err) => console.error('Failed to update presence:', err));
  }, 100); // Throttle to every 100ms

  // Update cursor position when mouse moves
  useEffect(() => {
    if (debouncedMousePosition && projectId) {
      handleMoveCursor(debouncedMousePosition.x, debouncedMousePosition.y);
    }
  }, [debouncedMousePosition, projectId, handleMoveCursor]);

  // // Update viewport when it changes
  // useEffect(() => {
  //   if (projectId) {
  //     updatePresence({
  //       projectId,
  //       x: mousePosition.x,
  //       y: mousePosition.y,
  //       tool: selectedTool,
  //       viewport: {
  //         x: debouncedViewport.x,
  //         y: debouncedViewport.y,
  //         scale: debouncedViewport.scale,
  //       },
  //     }).catch((err) => console.error('Failed to update viewport:', err));
  //   }
  // }, [
  //   debouncedViewport,
  //   projectId,
  //   updatePresence,
  //   mousePosition.x,
  //   mousePosition.y,
  //   selectedTool,
  // ]);

  // Leave project when component unmounts
  useEffect(() => {
    return () => {
      if (projectId) {
        leaveProject({ projectId }).catch((err) =>
          console.error('Failed to leave project:', err)
        );
      }
    };
  }, [projectId, leaveProject]);

  // Clear drawing and cancel current operation
  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    setSelectedShapeIds([]);
    setEditingTextId(null);
    setTempShape(null);

    clearSnap();
  };

  // Delete selected shapes
  const handleDeleteShape = async () => {
    if (!selectedShapeIds.length) return;

    await deleteShapes({ shapeIds: selectedShapeIds });

    setSelectedShapeIds([]);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditingState(createInitialEditingState());
        handleCancelDrawing();
        setSelectedTool('select');
        setSelectedTab('tools');
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedShapeIds.length > 0) {
          handleDeleteShape();
          handleCancelDrawing();
          setSelectedTool('select');
          setSelectedTab('tools');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShapeIds]);

  // Add this before the return statement in AutoCADClone component
  const togglePolarTracking = () => {
    setPolarSettings((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const updatePolarAngleIncrement = (increment: number) => {
    // Calculate the angles based on the increment
    const angles: number[] = [];
    for (let angle = 0; angle < 360; angle += increment) {
      angles.push(angle);
    }

    setPolarSettings((prev) => ({
      ...prev,
      angleIncrement: increment,
      angles: angles,
    }));
  };

  const keyBuffer = useRef<string>('');
  const keyBufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add these changes to the setEditingTool function in the useEditing hook:
  const setEditingToolWithDrawing = (tool: EditingTool | null) => {
    // When activating an editing tool, set the drawing tool to select
    if (tool) {
      setSelectedTool('select');
    }

    setEditingTool(tool);
  };

  // Inside your component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle Escape to cancel current operation
      if (e.key === 'Escape') {
        setEditingState(createInitialEditingState());
        handleCancelDrawing();
        setSelectedTool('select');
        setSelectedTab('tools');
        keyBuffer.current = '';
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapeIds.length > 0) {
          handleDeleteShape();
          handleCancelDrawing();
          setSelectedTool('select');
          setSelectedTab('tools');
        }
      }

      // Handle common shortcuts
      if (e.ctrlKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
          return;
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Only process shortcut commands when not in active operation
      if (editingState.isActive || drawingPoints.length > 0) return;

      // Track typed keys for AutoCAD-like command input
      if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
        // Clear any pending timeout
        if (keyBufferTimeoutRef.current) {
          clearTimeout(keyBufferTimeoutRef.current);
        }

        // Add key to buffer
        keyBuffer.current += e.key.toLowerCase();

        // Check for drawing tool shortcuts
        const drawingShortcuts: Record<string, string> = {
          l: 'line',
          c: 'circle',
          a: 'arc',
          r: 'rectangle',
          p: 'polygon',
          t: 'text',
          sp: 'spline',
        };

        // Check editing tool shortcuts from the editing Tools Data
        const editingShortcuts: Record<string, EditingTool> = {
          m: 'move',
          cp: 'copy',
          ro: 'rotate',
          mi: 'mirror',
          o: 'offset',
        };

        // Check for drawing tool match
        if (drawingShortcuts[keyBuffer.current]) {
          // Clear any active editing state first
          if (editingState.isActive) {
            setEditingState(createInitialEditingState());
          }
          setSelectedTool(drawingShortcuts[keyBuffer.current] as DrawingTool);
          keyBuffer.current = '';
        }
        // Check for editing tool match
        else if (editingShortcuts[keyBuffer.current]) {
          // Using the wrapper function to also set selectedTool to 'select'
          setEditingToolWithDrawing(editingShortcuts[keyBuffer.current]);
          keyBuffer.current = '';
        } else {
          // Set timeout to clear buffer after 1 second
          keyBufferTimeoutRef.current = setTimeout(() => {
            keyBuffer.current = '';
          }, 1000);
        }
      } else if (e.key === 'Enter' && keyBuffer.current) {
        // Enter key should execute the current command if any
        if (keyBuffer.current === 'undo') {
          handleUndo();
        } else if (keyBuffer.current === 'redo') {
          handleRedo();
        }
        keyBuffer.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (keyBufferTimeoutRef.current) {
        clearTimeout(keyBufferTimeoutRef.current);
      }
    };
  }, [
    editingState.isActive,
    drawingPoints.length,
    setEditingState,
    setEditingToolWithDrawing,
    setSelectedTool,
    setDrawingPoints,
    setTempShape,
    setSelectedShapeIds,
    shapes,
    handleUndo,
    handleRedo,
  ]);

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex flex-1 overflow-hidden'>
        <SidePanel
          scale={scale}
          offset={offset}
          selectedTool={selectedTool}
          drawingPoints={drawingPoints}
          mousePosition={mousePosition}
          handleCancelDrawing={handleCancelDrawing}
          completeShape={completeShape}
          snapSettings={snapSettings}
          toggleSnapMode={toggleSnapMode}
          setSelectedTool={setSelectedTool}
          gridSize={gridSize}
          setGridSize={setGridSize}
          setScale={setScale}
          handleDeleteShape={handleDeleteShape}
          setShowArcMode={setShowArcMode}
          toggleSnapping={toggleSnapping}
          setSnapSettings={setSnapSettings}
          setShowTextDialog={setShowTextDialog}
          setShowPolygonDialog={setShowPolygonDialog}
          setShowEllipseDialog={setShowEllipseDialog}
          setShowSplineDialog={setShowSplineDialog}
          setShowDimensionDialog={setShowDimensionDialog}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          setDrawingPoints={setDrawingPoints}
          setTempShape={setTempShape}
          polarSettings={polarSettings}
          setShowPolarDialog={setShowPolarDialog}
          editingState={editingState}
          setEditingState={setEditingState}
          setShowCollabsDialog={setShowCollabsDialog}
        />

        {/* Drawing canvas */}
        <div
          className='flex-1 relative overflow-hidden flex items-center justify-center'
          ref={containerRef}
        >
          <canvas
            ref={canvasRef}
            onWheel={(e) =>
              handleWheel({ e, scale, offset, setScale, setOffset })
            }
            onClick={(e) => {
              // Handle editing clicks if editing mode is active
              if (editingState.isActive) {
                handleEditingClick(e);

                handleSelection({
                  e,
                  scale,
                  offset,
                  shapes,
                  setSelectedShapeIds,
                });
              } else {
                handleCanvasClick({
                  e,
                  selectedTool,
                  scale,
                  offset,
                  drawingPoints,
                  setDrawingPoints,
                  setTempShape,
                  tempShape,
                  ellipseParams,
                  splineTension,
                  polygonSides,
                  completeShape,
                  shapes,
                  setSelectedShapeIds,
                  arcMode,
                  snapEnabled: snapSettings.enabled,
                  activeSnapResult,
                  textParams,
                  dimensionParams,
                });
              }
            }}
            onDoubleClick={(e) => {
              // Only handle double click when not in editing mode
              if (!editingState.isActive) {
                handleCanvasDoubleClick({
                  e,
                  selectedTool,
                  drawingPoints,
                  splineTension,
                  completeShape,
                  scale,
                  offset,
                  shapes,
                  setShowTextDialog,
                  setTextParams,
                  setEditingTextId,
                });
              }
            }}
            onMouseDown={(e) => {
              if (editingState.isActive && editingState.phase === 'select') {
                // In editing mode and selection phase, start area selection
                startAreaSelection(e, scale, offset, setAreaSelection);
              } else if (!editingState.isActive) {
                // Not in editing mode, handle regular mouse down
                handleMouseDown({
                  e,
                  selectedTool,
                  scale,
                  offset,
                  drawingPoints,
                  setIsDragging,
                  setDragStart,
                  setDrawingPoints,
                  setTempShape,
                  setAreaSelection,
                  snapEnabled: snapSettings.enabled,
                  activeSnapResult,
                });
              }
            }}
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
                textParams,
                dimensionParams,
                polarSettings,
                handleMoveCursor,
              })
            }
            onMouseUp={(e) => {
              handleMouseUp({
                e,
                areaSelection,
                shapes,
                setAreaSelection,
                setSelectedShapeIds,
                setIsDragging,
              });
            }}
            onMouseLeave={() => {
              setIsDragging(false);
              clearSnap();
            }}
            className={`cursor-${editingState.isActive ? 'pointer' : 'crosshair'} bg-muted`}
          />

          {/* Render collaborator cursors */}
          {activeUsers &&
            activeUsers
              .filter((user) => !user.isSelf) // Don't show our own cursor
              .map((user) => (
                <CollaboratorCursor
                  key={user.userId}
                  x={user.x * scale + offset.x}
                  y={user.y * scale + offset.y}
                  name={getCollaboratorName(user.userId, collaborators)}
                  color={getUserColor(user.userId)}
                  tool={user.tool}
                />
              ))}
        </div>

        {editingState.isActive && (
          <div className='absolute top-4 left-1/2 transform -translate-x-1/2 bg-background px-4 py-2 rounded-md shadow-md z-10 border'>
            <p className='text-sm font-medium'>{statusMessage}</p>
            {commandBuffer && (
              <p className='text-xs text-muted-foreground'>{commandBuffer}</p>
            )}
          </div>
        )}
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

      <TextDialog
        shapes={shapes}
        showTextDialog={showTextDialog}
        setShowTextDialog={setShowTextDialog}
        textParams={textParams}
        setTextParams={setTextParams}
        editingTextId={editingTextId}
        setEditingTextId={setEditingTextId}
      />

      <DimensionDialog
        showDimensionDialog={showDimensionDialog}
        setShowDimensionDialog={setShowDimensionDialog}
        dimensionParams={dimensionParams}
        setDimensionParams={setDimensionParams}
      />

      <PolarTrackingDialog
        showPolarDialog={showPolarDialog}
        setShowPolarDialog={setShowPolarDialog}
        polarSettings={polarSettings}
        setPolarSettings={setPolarSettings}
        updatePolarAngleIncrement={updatePolarAngleIncrement}
        togglePolarTracking={togglePolarTracking}
      />

      <Collaborators
        projectId={projectId}
        showCollabsDialog={showCollabsDialog}
        setShowCollabsDialog={setShowCollabsDialog}
      />
    </div>
  );
};
