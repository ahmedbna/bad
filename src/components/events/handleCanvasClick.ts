import { DrawingTool, ArcMode } from '@/constants';
import {
  Point,
  ShapeProperties,
  Shape,
  TextParams,
  DimensionParams,
} from '@/types';
import { handleSelection } from './handleSelection';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { snapPointToGrid } from '@/utils/snapPointToGrid';
import {
  angleBetweenPoints,
  calculateDistance,
  calculatePerpendicularDistance,
} from '@/utils/calculations';
import {
  handleCenterStartEndArc,
  handleStartCenterEndArc,
  handleStartEndDirectionArc,
  handleStartEndRadiusArc,
  handleThreePointArc,
} from '../arc/handle-arc';
import { SnapResult } from '../snap/useSnapping';

interface Props {
  e: React.MouseEvent<HTMLCanvasElement>;
  selectedTool: DrawingTool;
  scale: number;
  offset: Point;
  tempShape: Shape | null;
  arcAngles: { startAngle: number; endAngle: number };
  ellipseParams: {
    radiusX: number;
    radiusY: number;
    rotation: number;
    isFullEllipse: boolean;
  };
  splineTension: number;
  polygonSides: number;
  drawingPoints: Point[];
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
  completeShape: (points: Point[], properties?: ShapeProperties) => void;
  shapes: Shape[];
  setSelectedShapes: React.Dispatch<React.SetStateAction<string[]>>;
  snapToGrid: boolean;
  gridSize: number;
  arcMode: ArcMode;
  snapEnabled: boolean;
  activeSnapResult: SnapResult;
  textParams?: TextParams;
  dimensionParams: DimensionParams;
}

/**
 * Handles canvas click events for drawing various shapes
 */
export const handleCanvasClick = ({
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
  snapEnabled,
  activeSnapResult,
  textParams,
  dimensionParams,
}: Props) => {
  try {
    // Get mouse coordinates relative to canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Use snap point if available, otherwise calculate world point
    let worldPoint: Point;
    if (snapEnabled && activeSnapResult) {
      worldPoint = activeSnapResult.point;
    } else {
      worldPoint = canvasToWorld({
        point: { x: mouseX, y: mouseY },
        offset,
        scale,
      });

      // Apply grid snapping if enabled and no other snap is active
      if (snapToGrid && !activeSnapResult) {
        worldPoint = {
          x: Math.round(worldPoint.x / gridSize) * gridSize,
          y: Math.round(worldPoint.y / gridSize) * gridSize,
        };
      }
    }

    // Selection tool handling
    if (selectedTool === 'select') {
      handleSelection({
        e,
        scale,
        offset,
        shapes,
        setSelectedShapes,
      });
      return;
    }

    // Early exit if click is outside the canvas bounds
    if (
      mouseX < 0 ||
      mouseY < 0 ||
      mouseX > rect.width ||
      mouseY > rect.height
    ) {
      return;
    }

    const snappedPoint = snapPointToGrid({
      point: worldPoint,
      snapToGrid,
      gridSize,
    });

    // Handle text tool specifically
    if (selectedTool === 'text') {
      // For text, we only need one click to place it
      if (textParams) {
        completeShape([snappedPoint], {
          textParams: {
            content: textParams.content || 'Sample Text',
            fontSize: textParams.fontSize || 12,
            fontFamily: textParams.fontFamily || 'Arial',
            fontStyle: textParams.fontStyle || 'normal',
            fontWeight: textParams.fontWeight || 'normal',
            rotation: textParams.rotation || 0,
            justification: textParams.justification || 'left',
          },
        });
      }
      return;
    }

    // Handle dimension tool specifically
    if (selectedTool === 'dimension') {
      if (drawingPoints.length === 0) {
        // First point for dimension - start the dimension line
        setDrawingPoints([snappedPoint]);

        // Set temporary shape for preview
        const newDimShape: Shape = {
          id: `temp-dim-${Date.now()}`,
          type: 'dimension',
          points: [snappedPoint],
          properties: {
            dimensionParams: dimensionParams || {
              dimensionType: 'linear',
              offset: 25,
              extensionLineOffset: 5,
              arrowSize: 8,
              textHeight: 12,
              precision: 2,
              units: '',
              showValue: true,
              textRotation: 0,
              value: 0,
            },
            isCompleted: false,
          },
        };

        setTempShape(newDimShape);
      } else if (drawingPoints.length === 1) {
        // Second point for dimension - complete the dimension
        const dx = snappedPoint.x - drawingPoints[0].x;
        const dy = snappedPoint.y - drawingPoints[0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate the midpoint for text position
        const midPoint = {
          x: (drawingPoints[0].x + snappedPoint.x) / 2,
          y: (drawingPoints[0].y + snappedPoint.y) / 2,
        };

        // Get perpendicular offset for text
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        const offsetAmount = dimensionParams?.offset || 25;

        // Calculate text position
        const textPosition = {
          x: midPoint.x + Math.cos(perpAngle) * offsetAmount,
          y: midPoint.y + Math.sin(perpAngle) * offsetAmount,
        };

        // Complete the dimension with calculated properties
        completeShape([drawingPoints[0], snappedPoint], {
          dimensionParams: dimensionParams || {
            dimensionType: 'linear',
            offset: 25,
            extensionLineOffset: 5,
            arrowSize: 8,
            textHeight: 12,
            precision: 2,
            units: '',
            showValue: true,
            textRotation: 0,
            value: distance,
            textPosition: textPosition,
          },
        });
      }
      return;
    }

    // First point in a shape
    if (drawingPoints.length === 0) {
      startNewShape(snappedPoint, selectedTool, setDrawingPoints, setTempShape);
      return;
    }

    // Handle subsequent points based on the selected tool
    handleShapeProgress(
      e,
      snappedPoint,
      selectedTool,
      drawingPoints,
      tempShape,
      ellipseParams,
      splineTension,
      polygonSides,
      setDrawingPoints,
      setTempShape,
      completeShape,
      arcMode
    );
  } catch (error) {
    console.error('Error in handleCanvasClick:', error);
    // Optionally reset the state to recover from error
    setDrawingPoints([]);
    setTempShape(null);
  }
};

/**
 * Starts a new shape with the first point
 */
const startNewShape = (
  point: Point,
  selectedTool: DrawingTool,
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  setDrawingPoints([point]);

  // Create temporary shape
  const newTempShape: Shape = {
    id: `temp-${Date.now()}`,
    type: selectedTool,
    points: [point],
    properties: {},
  };

  setTempShape(newTempShape);
};

/**
 * Handles shape progress after first point is set
 */
const handleShapeProgress = (
  e: React.MouseEvent<HTMLCanvasElement>,
  snappedPoint: Point,
  selectedTool: DrawingTool,
  drawingPoints: Point[],
  tempShape: Shape | null,
  ellipseParams: {
    radiusX: number;
    radiusY: number;
    rotation: number;
    isFullEllipse: boolean;
  },
  splineTension: number,
  polygonSides: number,
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void,
  arcMode: ArcMode
) => {
  switch (selectedTool) {
    case 'line':
      completeShape([drawingPoints[0], snappedPoint]);
      break;

    case 'polyline':
      handlePolylineProgress(
        e,
        snappedPoint,
        drawingPoints,
        setDrawingPoints,
        setTempShape,
        completeShape
      );
      break;

    case 'rectangle':
      completeShape([drawingPoints[0], snappedPoint]);
      break;

    case 'circle':
      handleCircleProgress(snappedPoint, drawingPoints, completeShape);
      break;

    case 'arc':
      handleArcDrawing(
        arcMode,
        snappedPoint,
        drawingPoints,
        setDrawingPoints,
        setTempShape,
        completeShape
      );
      break;

    case 'ellipse':
      handleEllipseProgress(
        snappedPoint,
        drawingPoints,
        setDrawingPoints,
        ellipseParams,
        tempShape,
        setTempShape,
        completeShape
      );
      break;

    case 'polygon':
      handlePolygonProgress(
        snappedPoint,
        drawingPoints,
        polygonSides,
        completeShape
      );
      break;

    case 'spline':
      handleSplineProgress(
        e,
        snappedPoint,
        drawingPoints,
        splineTension,
        setDrawingPoints,
        setTempShape,
        completeShape
      );
      break;

    default:
      completeShape([...drawingPoints, snappedPoint]);
      break;
  }
};

/**
 * Handles polyline-specific drawing logic
 */
const handlePolylineProgress = (
  e: React.MouseEvent<HTMLCanvasElement>,
  snappedPoint: Point,
  drawingPoints: Point[],
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  const updatedPoints = [...drawingPoints, snappedPoint];
  setDrawingPoints(updatedPoints);

  // Double click completes the polyline
  if (e.detail === 2) {
    completeShape(updatedPoints);
  } else {
    // Update temp shape with new point
    setTempShape((prevShape) =>
      prevShape
        ? {
            ...prevShape,
            points: updatedPoints,
          }
        : null
    );
  }
};

/**
 * Handles circle-specific drawing logic
 */
const handleCircleProgress = (
  snappedPoint: Point,
  drawingPoints: Point[],
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  const center = drawingPoints[0];
  const radius = calculateDistance(center, snappedPoint);
  completeShape([center], { radius });
};

/**
 * Handles ellipse-specific drawing logic
 */
const handleEllipseProgress = (
  snappedPoint: Point,
  drawingPoints: Point[],
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  ellipseParams: {
    radiusX: number;
    radiusY: number;
    rotation: number;
    isFullEllipse: boolean;
  },
  tempShape: Shape | null,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  const center = drawingPoints[0];

  if (drawingPoints.length === 1) {
    // Second click determines radiusX and sets the direction
    const distance = calculateDistance(center, snappedPoint);
    const angle = angleBetweenPoints(center, snappedPoint);

    setDrawingPoints([...drawingPoints, snappedPoint]);

    // Update temp shape with first axis
    setTempShape((prevShape) =>
      prevShape
        ? {
            ...prevShape,
            properties: {
              radiusX: distance,
              radiusY:
                ellipseParams.radiusY * (distance / ellipseParams.radiusX),
              rotation: angle,
              isFullEllipse: ellipseParams.isFullEllipse,
            },
          }
        : null
    );
  } else if (drawingPoints.length === 2) {
    // Third click determines radiusY
    const center = drawingPoints[0];
    const firstRadius = tempShape?.properties?.radiusX || 0;
    const rotation = tempShape?.properties?.rotation || 0;

    // Calculate perpendicular distance for radiusY
    const radiusY = calculatePerpendicularDistance(
      center,
      snappedPoint,
      rotation
    );

    completeShape([center], {
      radiusX: firstRadius,
      radiusY,
      rotation,
      isFullEllipse: ellipseParams.isFullEllipse,
    });
  }
};

/**
 * Handles polygon-specific drawing logic
 */
const handlePolygonProgress = (
  snappedPoint: Point,
  drawingPoints: Point[],
  polygonSides: number,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  const center = drawingPoints[0];
  const radius = calculateDistance(center, snappedPoint);

  completeShape([center], {
    radius,
    sides: parseInt(polygonSides.toString(), 10),
  });
};

/**
 * Handles spline-specific drawing logic
 */
const handleSplineProgress = (
  e: React.MouseEvent<HTMLCanvasElement>,
  snappedPoint: Point,
  drawingPoints: Point[],
  splineTension: number,
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  const updatedPoints = [...drawingPoints, snappedPoint];
  setDrawingPoints(updatedPoints);

  // Update temp shape with the new point
  setTempShape((prevShape) =>
    prevShape
      ? {
          ...prevShape,
          points: updatedPoints,
          properties: { tension: splineTension },
        }
      : null
  );

  // Double-click to complete spline
  if (e.detail === 2 && updatedPoints.length >= 3) {
    completeShape(updatedPoints, { tension: splineTension });
  }
};

/**
 * Handles arc-specific drawing logic
 */
const handleArcDrawing = (
  arcMode: ArcMode,
  point: Point,
  drawingPoints: Point[],
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  if (arcMode === 'ThreePoint') {
    handleThreePointArc(
      point,
      drawingPoints,
      setDrawingPoints,
      setTempShape,
      completeShape
    );
  } else if (arcMode === 'StartCenterEnd') {
    handleStartCenterEndArc(
      point,
      drawingPoints,
      setDrawingPoints,
      setTempShape,
      completeShape
    );
  } else if (arcMode === 'CenterStartEnd') {
    handleCenterStartEndArc(
      point,
      drawingPoints,
      setDrawingPoints,
      setTempShape,
      completeShape
    );
  } else if (arcMode === 'StartEndRadius') {
    handleStartEndRadiusArc(
      point,
      drawingPoints,
      setDrawingPoints,
      setTempShape,
      completeShape
    );
  } else if (arcMode === 'StartEndDirection') {
    handleStartEndDirectionArc(
      point,
      drawingPoints,
      setDrawingPoints,
      setTempShape,
      completeShape
    );
  }
};
