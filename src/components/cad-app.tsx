'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { drawGrid } from './draw/draw-grid';
import { Point, ShapeProperties } from '@/types';
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
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CollaboratorCursor } from './collaboration/collaborator-cursor';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Collaborators,
  getCollaboratorName,
  getUserColor,
} from './collaboration/collaborators';
import { LayersDialog } from './dialogs/layers-dialog';
import { useTheme } from 'next-themes';
import { updateTempShapeFromCoordinates } from '@/lib/temp-shape-coordinates';
import { updateTempShapeWithNewProperties } from '@/lib/temp-shape-properties';
import {
  ControlPoint,
  getControlPointAtPosition,
  getControlPoints,
} from './editing/control-points';
import {
  createInitialControlPointEditingState,
  ControlPointEditingState,
  startControlPointEdit,
} from './editing/control-point-editing';

type Props = {
  project: Doc<'projects'> & { layers: Doc<'layers'>[] };
  projectId: Id<'projects'>;
  shapes: Array<Doc<'shapes'> & { layer: Doc<'layers'> }>;
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
  project,
  projectId,
  shapes,
  activeUsers,
  collaborators,
  currentUser,
}: Props) => {
  const { resolvedTheme: theme } = useTheme();

  const createShape = useMutation(api.shapes.create);
  const updateShape = useMutation(api.shapes.update);
  const deleteShapes = useMutation(api.shapes.deleteShapes);

  // Collaboration-specific mutations and queries
  const updatePresence = useMutation(api.presence.updatePresence);
  const leaveProject = useMutation(api.presence.leaveProject);

  const lineLengthRef = useRef<HTMLInputElement>(null);
  const lineAngleRef = useRef<HTMLInputElement>(null);
  const rectangleWidthRef = useRef<HTMLInputElement>(null);
  const rectangleLengthRef = useRef<HTMLInputElement>(null);
  const circleRadiusRef = useRef<HTMLInputElement>(null);
  const circleDiameterRef = useRef<HTMLInputElement>(null);
  const arcRadiusRef = useRef<HTMLInputElement>(null);
  const arcStartAngleRef = useRef<HTMLInputElement>(null);
  const arcEndAngleRef = useRef<HTMLInputElement>(null);
  const polygonRadiusRef = useRef<HTMLInputElement>(null);
  const polygonSidesRef = useRef<HTMLInputElement>(null);
  const ellipseRadiusXRef = useRef<HTMLInputElement>(null);
  const ellipseRadiusYRef = useRef<HTMLInputElement>(null);
  const ellipseRotationRef = useRef<HTMLInputElement>(null);
  const splineTensionRef = useRef<HTMLInputElement>(null);
  const xCoordinatenRef = useRef<HTMLInputElement>(null);
  const yCoordinatenRef = useRef<HTMLInputElement>(null);

  const [gridSize, setGridSize] = useState(10);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [areaSelection, setAreaSelection] = useState(
    createInitialAreaSelectionState()
  );

  const [selectedTool, setSelectedTool] = useState<DrawingTool>('select');
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [tempShape, setTempShape] = useState<
    (Doc<'shapes'> & { layer: Doc<'layers'> }) | null
  >(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<Id<'shapes'>[]>([]);
  const [currentLayerId, setCurrentLayerId] = useState<Id<'layers'>>(
    project.layers[0]._id
  );
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

  const [step, setStep] = useState(0);
  const [propertyInput, setPropertyInput] = useState<ShapeProperties>({});
  const [coordinateInput, setCoordinateInput] = useState<Point>({ x: 0, y: 0 });

  const [controlPointEditing, setControlPointEditing] =
    useState<ControlPointEditingState>(createInitialControlPointEditingState());

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

  // Dialog states
  const [showPolygonDialog, setShowPolygonDialog] = useState(false);
  const [showEllipseDialog, setShowEllipseDialog] = useState(false);
  const [showSplineDialog, setShowSplineDialog] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showDimensionDialog, setShowDimensionDialog] = useState(false);
  const [showCollabsDialog, setShowCollabsDialog] = useState(false);
  const [showLayersDialog, setShowLayersDialog] = useState(false);

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

  // AI integration state
  const [pendingAiShapes, setPendingAiShapes] = useState<any[]>([]);

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
    theme,
    controlPointEditing, // Add this to trigger redraw during control point editing
  ]);

  // Add this helper function to get currently selected shape for control points
  const selectedShapeForControlPoints = useMemo(() => {
    if (selectedShapeIds.length === 1) {
      return shapes.find((shape) => shape._id === selectedShapeIds[0]) || null;
    }
    return null;
  }, [selectedShapeIds, shapes]);

  // Add control points calculation
  const currentControlPoints = useMemo(() => {
    if (
      !selectedShapeForControlPoints ||
      selectedTool !== 'select' ||
      editingState.isActive
    ) {
      return {
        controlPoints: [],
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0 },
      };
    }
    return getControlPoints(selectedShapeForControlPoints);
  }, [selectedShapeForControlPoints, selectedTool, editingState.isActive]);

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
      dpr,
      theme,
    });

    // Draw all shapes (except the one being edited)
    shapes.forEach((shape) => {
      const isSelected = selectedShapeIds.includes(shape._id);
      // Don't draw the original shape if we're editing its control points
      const isBeingEdited =
        controlPointEditing.isEditing &&
        controlPointEditing.originalShape?._id === shape._id;

      if (!isBeingEdited) {
        drawShape({
          ctx,
          scale,
          offset,
          shape,
          isSelected,
          isTemporary: false,
          editingState,
          currentControlPoints,
          controlPointEditing,
        });
      }
    });

    const defaultlayer = project.layers.find((layer) => layer.isDefault);

    // Draw all ai shapes
    pendingAiShapes.forEach((shape) => {
      const newShape = {
        _id: `shape-${Math.random().toString(36).substring(2, 9)}` as Id<'shapes'>,
        userId: `user` as Id<'users'>,
        projectId: projectId,
        layerId: defaultlayer?._id!,
        type: shape.type,
        points: shape.points,
        layer: defaultlayer!,
        properties: shape.properties,
        _creationTime: new Date().getTime(),
      };

      drawShape({
        ctx,
        scale,
        offset,
        shape: newShape,
        isSelected: false,
        isTemporary: false,
        editingState,
        currentControlPoints,
        controlPointEditing,
      });
    });

    // Draw temporary shape while drawing OR during control point editing
    if (tempShape) {
      drawShape({
        ctx,
        scale,
        offset,
        shape: tempShape,
        isSelected: controlPointEditing.isEditing ? true : false, // Show as selected during control point editing
        isTemporary: true,
        editingState,
        currentControlPoints: controlPointEditing.isEditing
          ? getControlPoints(tempShape)
          : currentControlPoints,
        controlPointEditing,
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

  // Tracking our view position for collaboration
  const debouncedMousePosition = useDebounce(mousePosition, 20);
  const debouncedViewport = useDebounce(
    { x: offset.x, y: offset.y, scale },
    500
  );

  // Combine cursor and tool data
  const cursorData = useMemo(
    () => ({
      x: debouncedMousePosition?.x || 0,
      y: debouncedMousePosition?.y || 0,
      tool: selectedTool,
    }),
    [debouncedMousePosition?.x, debouncedMousePosition?.y, selectedTool]
  );

  // Handle cursor movement for collaboration (more frequent updates)
  useEffect(() => {
    if (!projectId || !currentUser || !debouncedMousePosition) return;

    // Send only cursor position and tool to server
    updatePresence({
      projectId,
      x: debouncedMousePosition.x,
      y: debouncedMousePosition.y,
      tool: selectedTool,
    }).catch((err) => console.error('Failed to update cursor presence:', err));
  }, [cursorData, projectId, currentUser]);

  // Handle viewport changes (less frequent updates)
  useEffect(() => {
    if (!projectId || !currentUser) return;

    // Send viewport information separately, less frequently
    updatePresence({
      projectId,
      // Still need to send cursor position as it's required by the API
      x: debouncedMousePosition?.x || 0,
      y: debouncedMousePosition?.y || 0,
      tool: selectedTool,
      viewport: {
        x: debouncedViewport.x,
        y: debouncedViewport.y,
        scale: debouncedViewport.scale,
      },
    }).catch((err) =>
      console.error('Failed to update viewport presence:', err)
    );
  }, [debouncedViewport, projectId, currentUser]);

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
    // Also clear control point editing
    setControlPointEditing(createInitialControlPointEditingState());

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

  // Complete shape and add to shapes list
  const completeShape = async (points: Point[], properties: {}) => {
    if (points.length < 1) return;

    createShape({
      projectId,
      type: selectedTool,
      points,
      properties,
      layerId: currentLayerId,
    });

    setDrawingPoints([]);
    setTempShape(null);

    clearSnap();
  };

  // Replace the existing handleInputChange function
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement> | KeyboardEvent | string,
    field: string
  ) => {
    let value: string | number;

    if (typeof event === 'string') {
      // Direct value passed (from keyboard shortcut)
      value = event;
    } else if ('target' in event && event.target instanceof HTMLInputElement) {
      // Regular form input change
      value = event.target.value;
    } else {
      // Unsupported event type
      return;
    }

    // Process the value based on field type
    if (field === 'x' || field === 'y') {
      const numericValue = parseFloat(value.toString());
      if (!isNaN(numericValue)) {
        setCoordinateInput((prev) => ({
          ...prev,
          [field]: numericValue,
        }));

        // Update temp shape with new coordinates if we have drawing points
        if (drawingPoints.length > 0) {
          const updatedPoint = {
            x: field === 'x' ? numericValue : coordinateInput.x || 0,
            y: field === 'y' ? numericValue : coordinateInput.y || 0,
          };
          updateTempShapeFromCoordinates({
            step,
            point: updatedPoint,
            drawingPoints,
            selectedTool,
            propertyInput,
            setTempShape,
          });
        }
      }
    } else {
      const numericValue = parseFloat(value.toString());
      if (!isNaN(numericValue)) {
        // For property inputs, create a new updated object
        const updatedPropertyInput = {
          ...propertyInput,
          [field]: numericValue,
        };

        // Handle special cases where one input should update another
        if (field === 'radius' && numericValue) {
          updatedPropertyInput.diameter = numericValue * 2;
        } else if (field === 'diameter' && numericValue) {
          updatedPropertyInput.radius = numericValue / 2;
        }

        // Update state with the complete new object
        setPropertyInput(updatedPropertyInput);

        // Immediately update the temp shape preview with the new properties
        if (drawingPoints.length > 0) {
          updateTempShapeWithNewProperties({
            step,
            selectedTool,
            drawingPoints,
            updatedPropertyInput,
            field,
            setTempShape,
            setCoordinateInput,
          });
        }
      }
    }
  };

  // Replace the existing useEffect for keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Escape' && controlPointEditing.isEditing) {
        setControlPointEditing(createInitialControlPointEditingState());
        setTempShape(null);
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
        if (selectedShapeIds.length > 0 && selectedTab !== 'ai') {
          handleDeleteShape();
          handleCancelDrawing();
          setSelectedTool('select');
          setSelectedTab('tools');
        }
        return;
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

      // Handle numeric input when a drawing tool is selected
      if (/^[0-9.-]$/.test(e.key) && selectedTool !== 'select') {
        e.preventDefault();

        // Step 0: Always focus on X coordinate first
        if (step === 0 && drawingPoints.length === 0) {
          xCoordinatenRef.current?.focus();
          if (xCoordinatenRef.current) {
            xCoordinatenRef.current.value = e.key;
            handleInputChange(e.key, 'x');
          }
          return;
        }

        // After first point is placed, focus on appropriate property input
        if (drawingPoints.length > 0) {
          switch (selectedTool) {
            case 'line':
            case 'polyline':
              lineLengthRef.current?.focus();
              if (lineLengthRef.current) {
                lineLengthRef.current.value = e.key;
                handleInputChange(e.key, 'length');
              }
              break;

            case 'rectangle':
              if (step === 1) {
                rectangleWidthRef.current?.focus();
                if (rectangleWidthRef.current) {
                  rectangleWidthRef.current.value = e.key;
                  handleInputChange(e.key, 'width');
                }
              } else if (step === 2) {
                rectangleLengthRef.current?.focus();
                if (rectangleLengthRef.current) {
                  rectangleLengthRef.current.value = e.key;
                  handleInputChange(e.key, 'length');
                }
              }
              break;

            case 'circle':
              circleRadiusRef.current?.focus();
              if (circleRadiusRef.current) {
                circleRadiusRef.current.value = e.key;
                handleInputChange(e.key, 'radius');
              }
              break;

            case 'arc':
              if (step === 1) {
                arcRadiusRef.current?.focus();
                if (arcRadiusRef.current) {
                  arcRadiusRef.current.value = e.key;
                  handleInputChange(e.key, 'radius');
                }
              } else if (step === 2) {
                arcStartAngleRef.current?.focus();
                if (arcStartAngleRef.current) {
                  arcStartAngleRef.current.value = e.key;
                  handleInputChange(e.key, 'startAngle');
                }
              }
              break;

            case 'polygon':
              polygonRadiusRef.current?.focus();
              if (polygonRadiusRef.current) {
                polygonRadiusRef.current.value = e.key;
                handleInputChange(e.key, 'radius');
              }
              break;

            case 'ellipse':
              if (step === 1) {
                ellipseRadiusXRef.current?.focus();
                if (ellipseRadiusXRef.current) {
                  ellipseRadiusXRef.current.value = e.key;
                  handleInputChange(e.key, 'radiusX');
                }
              } else if (step === 2) {
                ellipseRadiusYRef.current?.focus();
                if (ellipseRadiusYRef.current) {
                  ellipseRadiusYRef.current.value = e.key;
                  handleInputChange(e.key, 'radiusY');
                }
              }
              break;

            case 'spline':
              splineTensionRef.current?.focus();
              if (splineTensionRef.current) {
                splineTensionRef.current.value = e.key;
                handleInputChange(e.key, 'tension');
              }
              break;
          }
        }
        return;
      }

      // Handle Tab key to move between coordinate inputs
      if (/^[0-9.-]$/.test(e.key) && selectedTool !== 'select') {
        e.preventDefault();

        // Step 0: Always focus on X coordinate first
        if (step === 0 && drawingPoints.length === 0) {
          xCoordinatenRef.current?.focus();
          if (xCoordinatenRef.current) {
            xCoordinatenRef.current.value = e.key;
            handleInputChange(e.key, 'x');
          }
          return;
        }

        // After first point is placed, focus on appropriate property input
        if (drawingPoints.length > 0) {
          switch (selectedTool) {
            case 'line':
            case 'polyline':
              lineLengthRef.current?.focus();
              if (lineLengthRef.current) {
                lineLengthRef.current.value = e.key;
                handleInputChange(e.key, 'length');
              }
              break;

            case 'rectangle':
              if (step === 1) {
                rectangleWidthRef.current?.focus();
                if (rectangleWidthRef.current) {
                  rectangleWidthRef.current.value = e.key;
                  handleInputChange(e.key, 'width');
                }
              } else if (step === 2) {
                rectangleLengthRef.current?.focus();
                if (rectangleLengthRef.current) {
                  rectangleLengthRef.current.value = e.key;
                  handleInputChange(e.key, 'length');
                }
              }
              break;

            case 'circle':
              circleRadiusRef.current?.focus();
              if (circleRadiusRef.current) {
                circleRadiusRef.current.value = e.key;
                handleInputChange(e.key, 'radius');
              }
              break;

            case 'arc':
              if (step === 1) {
                arcRadiusRef.current?.focus();
                if (arcRadiusRef.current) {
                  arcRadiusRef.current.value = e.key;
                  handleInputChange(e.key, 'radius');
                }
              } else if (step === 2) {
                arcStartAngleRef.current?.focus();
                if (arcStartAngleRef.current) {
                  arcStartAngleRef.current.value = e.key;
                  handleInputChange(e.key, 'startAngle');
                }
              }
              break;

            case 'polygon':
              polygonRadiusRef.current?.focus();
              if (polygonRadiusRef.current) {
                polygonRadiusRef.current.value = e.key;
                handleInputChange(e.key, 'radius');
              }
              break;

            case 'ellipse':
              if (step === 1) {
                ellipseRadiusXRef.current?.focus();
                if (ellipseRadiusXRef.current) {
                  ellipseRadiusXRef.current.value = e.key;
                  handleInputChange(e.key, 'radiusX');
                }
              } else if (step === 2) {
                ellipseRadiusYRef.current?.focus();
                if (ellipseRadiusYRef.current) {
                  ellipseRadiusYRef.current.value = e.key;
                  handleInputChange(e.key, 'radiusY');
                }
              }
              break;

            case 'spline':
              splineTensionRef.current?.focus();
              if (splineTensionRef.current) {
                splineTensionRef.current.value = e.key;
                handleInputChange(e.key, 'tension');
              }
              break;
          }
        }
        return;
      }

      // Handle Tab key to move between coordinate inputs
      if (
        e.key === 'Tab' &&
        (step === 0 ||
          selectedTool === 'select' ||
          controlPointEditing.isEditing)
      ) {
        e.preventDefault();
        if (document.activeElement === xCoordinatenRef.current) {
          yCoordinatenRef.current?.focus();
        } else if (document.activeElement === yCoordinatenRef.current) {
          xCoordinatenRef.current?.focus();
        }
        return;
      }

      // Handle Enter key to confirm input and move to next step
      if (e.key === 'Enter') {
        if (
          document.activeElement === xCoordinatenRef.current ||
          document.activeElement === yCoordinatenRef.current
        ) {
          // If coordinates are being entered, place the first point
          if (coordinateInput.x !== 0 || coordinateInput.y !== 0) {
            const newPoint = { x: coordinateInput.x, y: coordinateInput.y };
            setDrawingPoints([newPoint]);
            setStep(1);

            // Clear coordinate inputs
            setCoordinateInput({ x: 0, y: 0 });
            if (xCoordinatenRef.current) xCoordinatenRef.current.value = '';
            if (yCoordinatenRef.current) yCoordinatenRef.current.value = '';

            // Focus on appropriate property input based on tool
            setTimeout(() => {
              switch (selectedTool) {
                case 'line':
                case 'polyline':
                  lineLengthRef.current?.focus();
                  break;
                case 'rectangle':
                  rectangleWidthRef.current?.focus();
                  break;
                case 'circle':
                  circleRadiusRef.current?.focus();
                  break;
                case 'arc':
                  arcRadiusRef.current?.focus();
                  break;
                case 'polygon':
                  polygonRadiusRef.current?.focus();
                  break;
                case 'ellipse':
                  ellipseRadiusXRef.current?.focus();
                  break;
                case 'spline':
                  splineTensionRef.current?.focus();
                  break;
              }
            }, 0);
          }
        } else {
          // If property input is active, complete the shape or move to next step
          const activeElement = document.activeElement as HTMLInputElement;
          if (activeElement && activeElement.value) {
            // For single-step shapes, complete immediately
            if (['line', 'circle', 'polygon'].includes(selectedTool)) {
              const properties = { ...propertyInput };
              completeShape(drawingPoints, properties);
              setStep(0);
            } else {
              // For multi-step shapes, move to next step
              setStep(step + 1);
            }
          }
        }
        return;
      }

      // Only process shortcut commands when not in active operation
      if (
        editingState.isActive ||
        drawingPoints.length > 0 ||
        controlPointEditing.isEditing
      )
        return;

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
          e: 'ellipse',
          pl: 'polyline',
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
          setStep(0);
          keyBuffer.current = '';

          // Auto-focus on X coordinate input after tool selection
          setTimeout(() => {
            xCoordinatenRef.current?.focus();
          }, 100);
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
    selectedTool,
    step,
    coordinateInput,
    propertyInput,
    controlPointEditing.isEditing,
    selectedShapeForControlPoints,
  ]);

  // Add this function to reset inputs when tool changes
  useEffect(() => {
    // Reset step and inputs when tool changes
    setStep(0);
    setCoordinateInput({ x: 0, y: 0 });
    setPropertyInput({});
    setDrawingPoints([]);
    setTempShape(null);

    // Don't clear control point editing when switching tools
    if (!controlPointEditing.isEditing) {
      // Clear all input fields
      if (xCoordinatenRef.current) xCoordinatenRef.current.value = '';
      if (yCoordinatenRef.current) yCoordinatenRef.current.value = '';
      if (lineLengthRef.current) lineLengthRef.current.value = '';
      if (lineAngleRef.current) lineAngleRef.current.value = '';
      if (rectangleWidthRef.current) rectangleWidthRef.current.value = '';
      if (rectangleLengthRef.current) rectangleLengthRef.current.value = '';
      if (circleRadiusRef.current) circleRadiusRef.current.value = '';
      if (circleDiameterRef.current) circleDiameterRef.current.value = '';
      if (arcRadiusRef.current) arcRadiusRef.current.value = '';
      if (arcStartAngleRef.current) arcStartAngleRef.current.value = '';
      if (arcEndAngleRef.current) arcEndAngleRef.current.value = '';
      if (polygonRadiusRef.current) polygonRadiusRef.current.value = '';
      if (ellipseRadiusXRef.current) ellipseRadiusXRef.current.value = '';
      if (ellipseRadiusYRef.current) ellipseRadiusYRef.current.value = '';
      if (splineTensionRef.current) splineTensionRef.current.value = '';
    }
  }, [selectedTool, controlPointEditing.isEditing]);

  const onLayerSelect = (layerId: Id<'layers'>) => {
    setCurrentLayerId(layerId);
  };

  // Get selected shapes objects
  const selectedShapes = shapes.filter((shape) =>
    selectedShapeIds.includes(shape._id)
  );

  // Enhanced handleControlPointMouseDown function
  // Mouse event handlers for control point editing
  const handleControlPointMouseDown = (
    e: MouseEvent,
    controlPoints: ControlPoint[],
    scale: number,
    offset: Point,
    selectedShape: Doc<'shapes'> | null
  ): ControlPointEditingState | null => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedControlPoint = getControlPointAtPosition(
      controlPoints,
      mouseX,
      mouseY,
      scale,
      offset
    );

    if (clickedControlPoint && selectedShape) {
      return startControlPointEdit(clickedControlPoint, selectedShape, {
        x: mouseX,
        y: mouseY,
      });
    }

    return null;
  };

  // Enhanced cursor management
  const getCanvasCursor = () => {
    if (controlPointEditing.isEditing) {
      return controlPointEditing.activeControlPoint?.cursor || 'crosshair';
    }

    if (
      selectedTool === 'select' &&
      selectedShapeForControlPoints &&
      !editingState.isActive
    ) {
      // Check if mouse is over a control point to show appropriate cursor
      const canvas = canvasRef.current;
      if (canvas && mousePosition) {
        const controlPoint = getControlPointAtPosition(
          currentControlPoints.controlPoints,
          mousePosition.x,
          mousePosition.y,
          scale,
          offset,
          12
        );
        if (controlPoint) {
          return controlPoint.cursor;
        }
      }
      return 'default'; // Default cursor for select tool
    }

    return 'crosshair';
  };

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
          setShowLayersDialog={setShowLayersDialog}
          currentLayerId={currentLayerId}
          selectedShapeIds={selectedShapeIds}
          selectedShapes={selectedShapes}
          pendingAiShapes={pendingAiShapes}
          setPendingAiShapes={setPendingAiShapes}
          project={project}
          lineLengthRef={lineLengthRef}
          lineAngleRef={lineAngleRef}
          rectangleWidthRef={rectangleWidthRef}
          rectangleLengthRef={rectangleLengthRef}
          circleRadiusRef={circleRadiusRef}
          circleDiameterRef={circleDiameterRef}
          arcRadiusRef={arcRadiusRef}
          arcStartAngleRef={arcStartAngleRef}
          arcEndAngleRef={arcEndAngleRef}
          polygonRadiusRef={polygonRadiusRef}
          polygonSidesRef={polygonSidesRef}
          ellipseRadiusXRef={ellipseRadiusXRef}
          ellipseRadiusYRef={ellipseRadiusYRef}
          ellipseRotationRef={ellipseRotationRef}
          splineTensionRef={splineTensionRef}
          xCoordinatenRef={xCoordinatenRef}
          yCoordinatenRef={yCoordinatenRef}
          handleInputChange={handleInputChange}
          propertyInput={propertyInput}
          coordinateInput={coordinateInput}
          setCoordinateInput={setCoordinateInput}
          setPropertyInput={setPropertyInput}
          setStep={setStep}
          step={step}
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
              // Existing mouse down logic
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
            onMouseMove={(e) => {
              // Existing mouse move logic
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
              });
            }}
            onMouseUp={(e) => {
              // Existing mouse up logic
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
            className={`bg-muted cursor-${getCanvasCursor()}`}
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

      <LayersDialog
        showLayersDialog={showLayersDialog}
        setShowLayersDialog={setShowLayersDialog}
        projectId={projectId}
        currentLayerId={currentLayerId}
        onLayerSelect={onLayerSelect}
      />
    </div>
  );
};
