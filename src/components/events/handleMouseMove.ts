import { DrawingTool, ArcMode } from '@/constants';
import { DimensionParams, Point, Shape, TextParams } from '@/types';
import { canvasToWorld } from '@/utils/canvasToWorld';
import {
  AreaSelectionState,
  updateAreaSelection,
} from '../select/handleAreaSelection';
import {
  previewCenterStartEndArc,
  previewStartCenterEndArc,
  previewStartEndDirectionArc,
  previewStartEndRadiusArc,
  previewThreePointArc,
} from '../arc/handle-arc';

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
  gridSize: number;
  areaSelection: AreaSelectionState;
  setMousePosition: React.Dispatch<React.SetStateAction<Point | null>>;
  setOffset: React.Dispatch<React.SetStateAction<Point>>;
  setDragStart: React.Dispatch<React.SetStateAction<Point>>;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
  setAreaSelection: React.Dispatch<React.SetStateAction<AreaSelectionState>>;
  arcMode: ArcMode;
  snapEnabled: boolean;
  handleCursorMove: (screenPoint: Point) => Point;
  textParams: TextParams;
  dimensionParams: DimensionParams;
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
  gridSize,
  setMousePosition,
  setOffset,
  setDragStart,
  setTempShape,
  areaSelection,
  setAreaSelection,
  arcMode,
  snapEnabled,
  handleCursorMove,
  textParams,
  dimensionParams,
}: MouseMoveProps) => {
  try {
    // Get mouse position in canvas coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const canvasPoint = { x: mouseX, y: mouseY };

    // First check for snapping - this will update activeSnapResult state
    let snappedPoint: Point;
    if (snapEnabled) {
      // handleCursorMove will update the activeSnapResult and return the snap point or original point
      snappedPoint = handleCursorMove(canvasPoint);
    } else {
      snappedPoint = canvasToWorld({ point: canvasPoint, offset, scale });
    }

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

    if (areaSelection.active) {
      // Update area selection
      updateAreaSelection(e, scale, offset, areaSelection, setAreaSelection);
    }

    // Handle panning when dragging
    if (isDragging) {
      handlePanning(mouseX, mouseY, dragStart, setOffset, setDragStart);
      return;
    }

    // Special case for text tool - show preview even before first click
    if (selectedTool === 'text') {
      if (!tempShape) {
        // Create a temporary text shape for preview if it doesn't exist
        const newTempShape: Shape = {
          id: 'temp-text-preview',
          type: 'text',
          points: [snappedPoint], // Store text position here
          properties: {
            textParams: {
              ...textParams,
            },
          },
        };
        setTempShape(newTempShape);
      } else {
        // Update existing temp shape with new position
        setTempShape({
          ...tempShape,
          points: [snappedPoint], // Update position
          properties: {
            ...tempShape.properties,
            textParams: textParams,
          },
        });
      }
    }
    // Update temporary shape if drawing in progress for other tools
    else if (tempShape && drawingPoints.length > 0) {
      updateTempShapeOnMouseMove({
        snappedPoint,
        selectedTool,
        tempShape,
        drawingPoints,
        ellipseParams,
        polygonSides,
        splineTension,
        setTempShape,
        arcMode,
        textParams,
        dimensionParams,
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
  snappedPoint,
  selectedTool,
  tempShape,
  drawingPoints,
  ellipseParams,
  polygonSides,
  splineTension,
  setTempShape,
  arcMode,
  textParams,
  dimensionParams,
}: {
  snappedPoint: Point;
  selectedTool: DrawingTool;
  tempShape: Shape;
  drawingPoints: Point[];
  ellipseParams: {
    radiusX: number;
    radiusY: number;
    rotation: number;
    isFullEllipse: boolean;
  };
  polygonSides: number;
  splineTension: number;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
  arcMode: ArcMode;
  textParams: TextParams;
  dimensionParams: DimensionParams;
}) => {
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
        arcMode,
        snappedPoint,
        drawingPoints,
        tempShape,
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

    case 'text':
      handleTextPreview(snappedPoint, tempShape, textParams, setTempShape);
      break;

    case 'dimension':
      handleDimensionPreview(
        drawingPoints,
        snappedPoint,
        tempShape,
        dimensionParams,
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
 * Handles live preview for arc drawing
 */
const handleArcPreview = (
  arcMode: ArcMode,
  point: Point,
  drawingPoints: Point[],
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (!tempShape) return;

  if (arcMode === 'ThreePoint') {
    previewThreePointArc(point, drawingPoints, tempShape, setTempShape);
  } else if (arcMode === 'StartCenterEnd') {
    previewStartCenterEndArc(point, drawingPoints, tempShape, setTempShape);
  } else if (arcMode === 'CenterStartEnd') {
    previewCenterStartEndArc(point, drawingPoints, tempShape, setTempShape);
  } else if (arcMode === 'StartEndRadius') {
    previewStartEndRadiusArc(point, drawingPoints, tempShape, setTempShape);
  } else if (arcMode === 'StartEndDirection') {
    previewStartEndDirectionArc(point, drawingPoints, tempShape, setTempShape);
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

/**
 * Handles text preview during mouse movement
 */
const handleTextPreview = (
  currentPoint: Point,
  tempShape: Shape,
  textParams: TextParams,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  // Update the temporary shape with the current mouse position
  // The position of text is stored in the points array
  setTempShape({
    ...tempShape,
    points: [currentPoint], // This is where the text position is stored
    properties: {
      ...tempShape.properties,
      textParams: {
        ...textParams,
      },
    },
  });
};
/**
 * Handles dimension preview during mouse movement
 */
const handleDimensionPreview = (
  drawingPoints: Point[],
  currentPoint: Point,
  tempShape: Shape,
  dimensionParams?: DimensionParams,
  setTempShape?: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (!setTempShape || drawingPoints.length < 1) return;

  // Calculate the distance between the points
  const dx = currentPoint.x - drawingPoints[0].x;
  const dy = currentPoint.y - drawingPoints[0].y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate the midpoint for text position
  const midPoint = {
    x: (drawingPoints[0].x + currentPoint.x) / 2,
    y: (drawingPoints[0].y + currentPoint.y) / 2,
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

  // Update the dimension shape
  setTempShape({
    ...tempShape,
    points: [drawingPoints[0], currentPoint],
    properties: {
      ...tempShape.properties,
      dimensionParams: {
        value: distance,
        textPosition: textPosition,
        dimensionType: dimensionParams?.dimensionType || 'linear',
        offset: dimensionParams?.offset || 25,
        extensionLineOffset: dimensionParams?.extensionLineOffset || 5,
        arrowSize: dimensionParams?.arrowSize || 8,
        textHeight: dimensionParams?.textHeight || 12,
        precision: dimensionParams?.precision || 2,
        units: dimensionParams?.units || '',
        showValue:
          dimensionParams?.showValue !== undefined
            ? dimensionParams.showValue
            : true,
        textRotation: dimensionParams?.textRotation || 0,
      },
    },
  });
};
