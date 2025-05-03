import { DrawingTool } from '@/types/drawing-tool';
import { Point } from '@/types/point';
import { ShapeProperties } from '@/types/property';
import { Shape } from '@/types/shape';
import { handleSelection } from './handleSelection';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { snapPointToGrid } from '@/utils/snapPointToGrid';

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
}: Props) => {
  try {
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

    // Get mouse coordinates relative to canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Early exit if click is outside the canvas bounds
    if (
      mouseX < 0 ||
      mouseY < 0 ||
      mouseX > rect.width ||
      mouseY > rect.height
    ) {
      return;
    }

    // Convert mouse coordinates to world coordinates
    const worldPoint = canvasToWorld({
      point: { x: mouseX, y: mouseY },
      scale,
      offset,
    });
    const snappedPoint = snapPointToGrid({
      point: worldPoint,
      snapToGrid,
      gridSize,
    });

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
      arcAngles,
      ellipseParams,
      splineTension,
      polygonSides,
      setDrawingPoints,
      setTempShape,
      completeShape
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
  arcAngles: { startAngle: number; endAngle: number },
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
  completeShape: (points: Point[], properties?: ShapeProperties) => void
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
      handleArcProgress(
        snappedPoint,
        drawingPoints,
        tempShape,
        arcAngles,
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
 * Handles arc-specific drawing logic
 */
const handleArcProgress = (
  snappedPoint: Point,
  drawingPoints: Point[],
  tempShape: Shape | null,
  arcAngles: { startAngle: number; endAngle: number },
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  const center = drawingPoints[0];

  if (drawingPoints.length === 1) {
    // Second click determines radius
    const radius = calculateDistance(center, snappedPoint);
    const angle = angleBetweenPoints(center, snappedPoint);

    setDrawingPoints([...drawingPoints, snappedPoint]);

    // Update temp shape with radius and start angle
    setTempShape((prevShape) =>
      prevShape
        ? {
            ...prevShape,
            properties: {
              radius,
              startAngle: angle,
              endAngle: angle + arcAngles.endAngle - arcAngles.startAngle,
            },
          }
        : null
    );
  } else if (drawingPoints.length === 2) {
    // Third click completes the arc
    const angle = angleBetweenPoints(center, snappedPoint);

    completeShape([center], {
      radius: tempShape?.properties?.radius || 0,
      startAngle: tempShape?.properties?.startAngle || 0,
      endAngle: angle,
    });
  }
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
 * Calculate distance between two points
 */
const calculateDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate angle between two points (in radians)
 */
const angleBetweenPoints = (center: Point, p: Point): number => {
  return Math.atan2(p.y - center.y, p.x - center.x);
};

/**
 * Calculate perpendicular distance from a point to a line through origin at given angle
 */
const calculatePerpendicularDistance = (
  center: Point,
  point: Point,
  rotation: number
): number => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const projectedX = dx * Math.cos(rotation) + dy * Math.sin(rotation);
  const projectedY = -dx * Math.sin(rotation) + dy * Math.cos(rotation);
  return Math.abs(projectedY);
};
