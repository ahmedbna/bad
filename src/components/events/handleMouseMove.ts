import { DrawingTool } from '@/types/drawing-tool';
import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { snapPointToGrid } from '@/utils/snapPointToGrid';

interface MouseMoveProps {
  e: React.MouseEvent<HTMLCanvasElement>;
  selectedTool: DrawingTool;
  scale: number;
  offset: Point;
  isDragging: boolean;
  dragStart: Point;
  tempShape: Shape | null;
  drawingPoints: Point[];
  arcAngles: { startAngle: number; endAngle: number };
  ellipseParams: {
    radiusX: number;
    radiusY: number;
    rotation: number;
    isFullEllipse: boolean;
  };
  polygonSides: number;
  splineTension: number;
  snapToGrid: boolean;
  gridSize: number;
  setMousePosition: React.Dispatch<React.SetStateAction<Point | null>>;
  setOffset: React.Dispatch<React.SetStateAction<Point>>;
  setDragStart: React.Dispatch<React.SetStateAction<Point>>;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
}

/**
 * Handles mouse movement over the canvas for drawing and navigation
 */
export const handleMouseMove = ({
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
}: MouseMoveProps) => {
  try {
    // Get mouse coordinates relative to canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Early exit if mouse is outside the canvas bounds
    if (
      mouseX < 0 ||
      mouseY < 0 ||
      mouseX > rect.width ||
      mouseY > rect.height
    ) {
      return;
    }

    // Update mouse position state
    setMousePosition({ x: mouseX, y: mouseY });

    // Handle panning when dragging
    if (isDragging) {
      handlePanning(mouseX, mouseY, dragStart, setOffset, setDragStart);
      return;
    }

    // Update temporary shape if drawing in progress
    if (tempShape && drawingPoints.length > 0) {
      updateTempShapeOnMouseMove({
        mouseX,
        mouseY,
        scale,
        offset,
        selectedTool,
        tempShape,
        drawingPoints,
        arcAngles,
        ellipseParams,
        polygonSides,
        splineTension,
        snapToGrid,
        gridSize,
        setTempShape,
      });
    }
  } catch (error) {
    console.error('Error in handleMouseMove:', error);
  }
};

/**
 * Handles panning functionality when dragging
 */
const handlePanning = (
  mouseX: number,
  mouseY: number,
  dragStart: Point,
  setOffset: React.Dispatch<React.SetStateAction<Point>>,
  setDragStart: React.Dispatch<React.SetStateAction<Point>>
) => {
  // Calculate drag delta
  const dx = mouseX - dragStart.x;
  const dy = mouseY - dragStart.y;

  // Update the viewport offset
  setOffset((prev) => ({
    x: prev.x + dx,
    y: prev.y + dy,
  }));

  // Update drag start position for next move
  setDragStart({ x: mouseX, y: mouseY });
};

/**
 * Updates temporary shape based on mouse movement
 */
const updateTempShapeOnMouseMove = ({
  mouseX,
  mouseY,
  scale,
  offset,
  selectedTool,
  tempShape,
  drawingPoints,
  arcAngles,
  ellipseParams,
  polygonSides,
  splineTension,
  snapToGrid,
  gridSize,
  setTempShape,
}: {
  mouseX: number;
  mouseY: number;
  scale: number;
  offset: Point;
  selectedTool: DrawingTool;
  tempShape: Shape;
  drawingPoints: Point[];
  arcAngles: { startAngle: number; endAngle: number };
  ellipseParams: {
    radiusX: number;
    radiusY: number;
    rotation: number;
    isFullEllipse: boolean;
  };
  polygonSides: number;
  splineTension: number;
  snapToGrid: boolean;
  gridSize: number;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
}) => {
  // Convert mouse coordinates to world coordinates
  const worldPoint = canvasToWorld({
    point: { x: mouseX, y: mouseY },
    scale,
    offset,
  });

  // Apply grid snapping if enabled
  const snappedPoint = snapPointToGrid({
    point: worldPoint,
    snapToGrid,
    gridSize,
  });

  // Handle different tools
  switch (selectedTool) {
    case 'line':
      handleLinePreview(drawingPoints, snappedPoint, tempShape, setTempShape);
      break;

    case 'polyline':
      handlePolylinePreview(
        drawingPoints,
        snappedPoint,
        tempShape,
        setTempShape
      );
      break;

    case 'rectangle':
      handleRectanglePreview(
        drawingPoints,
        snappedPoint,
        tempShape,
        setTempShape
      );
      break;

    case 'circle':
      handleCirclePreview(drawingPoints, snappedPoint, tempShape, setTempShape);
      break;

    case 'arc':
      handleArcPreview(
        drawingPoints,
        snappedPoint,
        tempShape,
        arcAngles,
        setTempShape
      );
      break;

    case 'ellipse':
      handleEllipsePreview(
        drawingPoints,
        snappedPoint,
        tempShape,
        ellipseParams,
        setTempShape
      );
      break;

    case 'polygon':
      handlePolygonPreview(
        drawingPoints,
        snappedPoint,
        tempShape,
        polygonSides,
        setTempShape
      );
      break;

    case 'spline':
      handleSplinePreview(
        drawingPoints,
        snappedPoint,
        tempShape,
        splineTension,
        setTempShape
      );
      break;

    default:
      break;
  }
};

/**
 * Handles live preview for line drawing
 */
const handleLinePreview = (
  drawingPoints: Point[],
  snappedPoint: Point,
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  setTempShape({
    ...tempShape,
    points: [drawingPoints[0], snappedPoint],
  });
};

/**
 * Handles live preview for polyline drawing
 */
const handlePolylinePreview = (
  drawingPoints: Point[],
  snappedPoint: Point,
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (drawingPoints.length > 0) {
    const newPoints = [...drawingPoints];

    if (newPoints.length > 1) {
      // Replace the last preview point
      newPoints.pop();
      newPoints.push(snappedPoint);
    } else {
      // Add a preview point
      newPoints.push(snappedPoint);
    }

    setTempShape({
      ...tempShape,
      points: newPoints,
    });
  }
};

/**
 * Handles live preview for rectangle drawing
 */
const handleRectanglePreview = (
  drawingPoints: Point[],
  snappedPoint: Point,
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  setTempShape({
    ...tempShape,
    points: [drawingPoints[0], snappedPoint],
  });
};

/**
 * Handles live preview for circle drawing
 */
const handleCirclePreview = (
  drawingPoints: Point[],
  snappedPoint: Point,
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  const circleCenter = drawingPoints[0];
  const radius = calculateDistance(circleCenter, snappedPoint);

  setTempShape({
    ...tempShape,
    properties: {
      ...tempShape.properties,
      radius,
    },
  });
};

/**
 * Handles live preview for arc drawing
 */
const handleArcPreview = (
  drawingPoints: Point[],
  snappedPoint: Point,
  tempShape: Shape,
  arcAngles: { startAngle: number; endAngle: number },
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  const arcCenter = drawingPoints[0];

  if (drawingPoints.length === 1) {
    // Showing radius preview
    const arcRadius = calculateDistance(arcCenter, snappedPoint);
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
    const arcAngle = angleBetweenPoints(arcCenter, snappedPoint);

    setTempShape({
      ...tempShape,
      properties: {
        ...tempShape.properties,
        endAngle: arcAngle,
      },
    });
  }
};

/**
 * Handles live preview for ellipse drawing
 */
const handleEllipsePreview = (
  drawingPoints: Point[],
  snappedPoint: Point,
  tempShape: Shape,
  ellipseParams: {
    radiusX: number;
    radiusY: number;
    rotation: number;
    isFullEllipse: boolean;
  },
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  const ellipseCenter = drawingPoints[0];

  if (drawingPoints.length === 1) {
    // Preview for first axis
    const distance = calculateDistance(ellipseCenter, snappedPoint);
    const angle = angleBetweenPoints(ellipseCenter, snappedPoint);

    setTempShape({
      ...tempShape,
      properties: {
        radiusX: distance,
        radiusY:
          ellipseParams.radiusY * (distance / (ellipseParams.radiusX || 1)),
        rotation: angle,
        isFullEllipse: ellipseParams.isFullEllipse,
      },
    });
  } else if (drawingPoints.length === 2) {
    // Preview for second axis
    const firstRadius = tempShape.properties?.radiusX || 0;
    const rotation = tempShape.properties?.rotation || 0;

    // Calculate perpendicular distance
    const radiusY = calculatePerpendicularDistance(
      ellipseCenter,
      snappedPoint,
      rotation
    );

    setTempShape({
      ...tempShape,
      properties: {
        ...tempShape.properties,
        radiusY,
      },
    });
  }
};

/**
 * Handles live preview for polygon drawing
 */
const handlePolygonPreview = (
  drawingPoints: Point[],
  snappedPoint: Point,
  tempShape: Shape,
  polygonSides: number,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  const polygonCenter = drawingPoints[0];
  const polygonRadius = calculateDistance(polygonCenter, snappedPoint);

  setTempShape({
    ...tempShape,
    properties: {
      ...tempShape.properties,
      radius: polygonRadius,
      sides: parseInt(polygonSides.toString(), 10),
    },
  });
};

/**
 * Handles live preview for spline drawing
 */
const handleSplinePreview = (
  drawingPoints: Point[],
  snappedPoint: Point,
  tempShape: Shape,
  splineTension: number,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (drawingPoints.length > 0) {
    setTempShape({
      ...tempShape,
      points: [...drawingPoints, snappedPoint],
      properties: {
        ...tempShape.properties,
        tension: splineTension,
      },
    });
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
