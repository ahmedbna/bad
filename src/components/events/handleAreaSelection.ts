import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { canvasToWorld } from '@/utils/canvasToWorld';

type AreaSelectionState = {
  active: boolean;
  startPoint: Point | null;
  endPoint: Point | null;
  selectionMode: 'crossing' | 'window';
};

/**
 * Determines if a shape is contained within the selection rectangle
 */
export const isShapeInSelectionArea = (
  shape: Shape,
  selectionStart: Point,
  selectionEnd: Point,
  selectionMode: 'crossing' | 'window'
): boolean => {
  // Determine selection rectangle bounds
  const minX = Math.min(selectionStart.x, selectionEnd.x);
  const maxX = Math.max(selectionStart.x, selectionEnd.x);
  const minY = Math.min(selectionStart.y, selectionEnd.y);
  const maxY = Math.max(selectionStart.y, selectionEnd.y);

  // For window selection (drag right), shape must be fully contained
  if (selectionMode === 'window') {
    return isShapeFullyContained(shape, minX, maxX, minY, maxY);
  }

  // For crossing selection (drag left), shape must intersect
  return isShapeIntersecting(shape, minX, maxX, minY, maxY);
};

/**
 * Determines if a shape is fully contained within the selection rectangle
 */
const isShapeFullyContained = (
  shape: Shape,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): boolean => {
  switch (shape.type) {
    case 'line':
      return (
        shape.points.length >= 2 &&
        isPointInRect(shape.points[0], minX, maxX, minY, maxY) &&
        isPointInRect(shape.points[1], minX, maxX, minY, maxY)
      );

    case 'polyline':
      return (
        shape.points.length >= 2 &&
        shape.points.every((point) =>
          isPointInRect(point, minX, maxX, minY, maxY)
        )
      );

    case 'rectangle':
      if (shape.points.length < 2) return false;
      return (
        isPointInRect(shape.points[0], minX, maxX, minY, maxY) &&
        isPointInRect(shape.points[1], minX, maxX, minY, maxY)
      );

    case 'circle':
      if (shape.points.length < 1 || !shape.properties?.radius) return false;
      const center = shape.points[0];
      const radius = shape.properties.radius;
      return (
        center.x - radius >= minX &&
        center.x + radius <= maxX &&
        center.y - radius >= minY &&
        center.y + radius <= maxY
      );

    case 'arc':
      if (!shape.points[0] || !shape.properties?.radius) return false;
      // Check if center and points on arc boundary are within rectangle
      const arcCenter = shape.points[0];
      const arcRadius = shape.properties.radius;
      const startAngle = shape.properties.startAngle || 0;
      const endAngle = shape.properties.endAngle || 0;

      // Check if center is in rect
      if (!isPointInRect(arcCenter, minX, maxX, minY, maxY)) return false;

      // Check multiple points on arc perimeter
      for (let angle = startAngle; angle <= endAngle; angle += Math.PI / 8) {
        const pointOnArc = {
          x: arcCenter.x + arcRadius * Math.cos(angle),
          y: arcCenter.y + arcRadius * Math.sin(angle),
        };
        if (!isPointInRect(pointOnArc, minX, maxX, minY, maxY)) return false;
      }
      return true;

    case 'ellipse':
      if (
        !shape.points[0] ||
        shape.properties?.radiusX === undefined ||
        shape.properties?.radiusY === undefined
      )
        return false;

      const ellipseCenter = shape.points[0];
      const radiusX = shape.properties.radiusX;
      const radiusY = shape.properties.radiusY;
      const rotation = shape.properties.rotation || 0;

      // Check extreme points of ellipse
      const rotCos = Math.cos(rotation);
      const rotSin = Math.sin(rotation);

      const points = [
        {
          // Right extreme
          x: ellipseCenter.x + radiusX * rotCos,
          y: ellipseCenter.y + radiusX * rotSin,
        },
        {
          // Left extreme
          x: ellipseCenter.x - radiusX * rotCos,
          y: ellipseCenter.y - radiusX * rotSin,
        },
        {
          // Top extreme
          x: ellipseCenter.x - radiusY * rotSin,
          y: ellipseCenter.y + radiusY * rotCos,
        },
        {
          // Bottom extreme
          x: ellipseCenter.x + radiusY * rotSin,
          y: ellipseCenter.y - radiusY * rotCos,
        },
      ];

      return points.every((point) =>
        isPointInRect(point, minX, maxX, minY, maxY)
      );

    case 'polygon':
      if (
        !shape.points[0] ||
        shape.properties?.radius === undefined ||
        shape.properties?.sides === undefined
      )
        return false;

      const polygonCenter = shape.points[0];
      const polygonRadius = shape.properties.radius;
      const sides = shape.properties.sides;

      // Check all vertices of the polygon
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        const vertex = {
          x: polygonCenter.x + polygonRadius * Math.cos(angle),
          y: polygonCenter.y + polygonRadius * Math.sin(angle),
        };
        if (!isPointInRect(vertex, minX, maxX, minY, maxY)) return false;
      }
      return true;

    case 'spline':
      return (
        shape.points.length >= 3 &&
        shape.points.every((point) =>
          isPointInRect(point, minX, maxX, minY, maxY)
        )
      );

    default:
      return false;
  }
};

/**
 * Determines if a shape intersects with the selection rectangle
 */
const isShapeIntersecting = (
  shape: Shape,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): boolean => {
  switch (shape.type) {
    case 'line':
      if (shape.points.length < 2) return false;
      return lineIntersectsRect(
        shape.points[0],
        shape.points[1],
        minX,
        maxX,
        minY,
        maxY
      );

    case 'polyline':
      if (shape.points.length < 2) return false;
      for (let i = 0; i < shape.points.length - 1; i++) {
        if (
          lineIntersectsRect(
            shape.points[i],
            shape.points[i + 1],
            minX,
            maxX,
            minY,
            maxY
          )
        ) {
          return true;
        }
      }
      return false;

    case 'rectangle':
      if (shape.points.length < 2) return false;
      // Check if any corner of the rectangle is in selection or vice versa
      const rectMinX = Math.min(shape.points[0].x, shape.points[1].x);
      const rectMaxX = Math.max(shape.points[0].x, shape.points[1].x);
      const rectMinY = Math.min(shape.points[0].y, shape.points[1].y);
      const rectMaxY = Math.max(shape.points[0].y, shape.points[1].y);

      // Check if rectangles intersect
      return !(
        rectMaxX < minX ||
        rectMinX > maxX ||
        rectMaxY < minY ||
        rectMinY > maxY
      );

    case 'circle':
      if (shape.points.length < 1 || !shape.properties?.radius) return false;
      return circleIntersectsRect(
        shape.points[0],
        shape.properties.radius,
        minX,
        maxX,
        minY,
        maxY
      );

    case 'arc':
      if (!shape.points[0] || !shape.properties?.radius) return false;
      const arcCenter = shape.points[0];
      const arcRadius = shape.properties.radius;
      const startAngle = shape.properties.startAngle || 0;
      const endAngle = shape.properties.endAngle || 0;

      // Check if center is in rect
      if (isPointInRect(arcCenter, minX, maxX, minY, maxY)) return true;

      // Check multiple points on arc perimeter
      for (let angle = startAngle; angle <= endAngle; angle += Math.PI / 8) {
        const pointOnArc = {
          x: arcCenter.x + arcRadius * Math.cos(angle),
          y: arcCenter.y + arcRadius * Math.sin(angle),
        };
        if (isPointInRect(pointOnArc, minX, maxX, minY, maxY)) return true;
      }

      // Check if arc intersects any edge of rectangle
      const angleStep = Math.PI / 16;
      for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
        const p1 = {
          x: arcCenter.x + arcRadius * Math.cos(angle),
          y: arcCenter.y + arcRadius * Math.sin(angle),
        };
        const p2 = {
          x: arcCenter.x + arcRadius * Math.cos(angle + angleStep),
          y: arcCenter.y + arcRadius * Math.sin(angle + angleStep),
        };
        if (lineIntersectsRect(p1, p2, minX, maxX, minY, maxY)) return true;
      }
      return false;

    case 'ellipse':
      if (
        !shape.points[0] ||
        shape.properties?.radiusX === undefined ||
        shape.properties?.radiusY === undefined
      )
        return false;

      // Check if center is in rect
      if (isPointInRect(shape.points[0], minX, maxX, minY, maxY)) return true;

      // Approximate ellipse with points
      const ellipseCenter = shape.points[0];
      const radiusX = shape.properties.radiusX;
      const radiusY = shape.properties.radiusY;
      const rotation = shape.properties.rotation || 0;
      const stepCount = 24;

      // Check points around the ellipse perimeter
      for (let i = 0; i < stepCount; i++) {
        const angle = (i * 2 * Math.PI) / stepCount;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Apply rotation and translation
        const x =
          ellipseCenter.x +
          radiusX * cos * Math.cos(rotation) -
          radiusY * sin * Math.sin(rotation);
        const y =
          ellipseCenter.y +
          radiusX * cos * Math.sin(rotation) +
          radiusY * sin * Math.cos(rotation);

        if (isPointInRect({ x, y }, minX, maxX, minY, maxY)) {
          return true;
        }
      }

      // Check consecutive perimeter points for intersection with rectangle edges
      for (let i = 0; i < stepCount; i++) {
        const angle1 = (i * 2 * Math.PI) / stepCount;
        const angle2 = ((i + 1) * 2 * Math.PI) / stepCount;

        const cos1 = Math.cos(angle1);
        const sin1 = Math.sin(angle1);
        const cos2 = Math.cos(angle2);
        const sin2 = Math.sin(angle2);

        const p1 = {
          x:
            ellipseCenter.x +
            radiusX * cos1 * Math.cos(rotation) -
            radiusY * sin1 * Math.sin(rotation),
          y:
            ellipseCenter.y +
            radiusX * cos1 * Math.sin(rotation) +
            radiusY * sin1 * Math.cos(rotation),
        };

        const p2 = {
          x:
            ellipseCenter.x +
            radiusX * cos2 * Math.cos(rotation) -
            radiusY * sin2 * Math.sin(rotation),
          y:
            ellipseCenter.y +
            radiusX * cos2 * Math.sin(rotation) +
            radiusY * sin2 * Math.cos(rotation),
        };

        if (lineIntersectsRect(p1, p2, minX, maxX, minY, maxY)) {
          return true;
        }
      }

      return false;

    case 'polygon':
      if (
        !shape.points[0] ||
        shape.properties?.radius === undefined ||
        shape.properties?.sides === undefined
      )
        return false;

      const polygonCenter = shape.points[0];
      const polygonRadius = shape.properties.radius;
      const sides = shape.properties.sides;

      // Check if center is in rect
      if (isPointInRect(polygonCenter, minX, maxX, minY, maxY)) return true;

      // Check if any vertex is in rect
      const vertices: Point[] = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        vertices.push({
          x: polygonCenter.x + polygonRadius * Math.cos(angle),
          y: polygonCenter.y + polygonRadius * Math.sin(angle),
        });
      }

      // Check if any vertex is in rect
      for (const vertex of vertices) {
        if (isPointInRect(vertex, minX, maxX, minY, maxY)) {
          return true;
        }
      }

      // Check if any edge intersects with rect
      for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        if (
          lineIntersectsRect(vertices[i], vertices[j], minX, maxX, minY, maxY)
        ) {
          return true;
        }
      }

      return false;

    case 'spline':
      if (shape.points.length < 3) return false;

      // Check if any control point is in rect
      for (const point of shape.points) {
        if (isPointInRect(point, minX, maxX, minY, maxY)) {
          return true;
        }
      }

      // Check if any segment intersects rect
      // Using linear approximation for segments
      for (let i = 0; i < shape.points.length - 1; i++) {
        if (
          lineIntersectsRect(
            shape.points[i],
            shape.points[i + 1],
            minX,
            maxX,
            minY,
            maxY
          )
        ) {
          return true;
        }
      }

      return false;

    default:
      return false;
  }
};

/**
 * Determines if a line segment intersects with a rectangle
 */
const lineIntersectsRect = (
  p1: Point,
  p2: Point,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): boolean => {
  // Check if either endpoint is inside the rectangle
  if (
    isPointInRect(p1, minX, maxX, minY, maxY) ||
    isPointInRect(p2, minX, maxX, minY, maxY)
  ) {
    return true;
  }

  // Check if line intersects any of the rectangle edges
  const rectEdges = [
    { p1: { x: minX, y: minY }, p2: { x: maxX, y: minY } }, // bottom
    { p1: { x: maxX, y: minY }, p2: { x: maxX, y: maxY } }, // right
    { p1: { x: maxX, y: maxY }, p2: { x: minX, y: maxY } }, // top
    { p1: { x: minX, y: maxY }, p2: { x: minX, y: minY } }, // left
  ];

  for (const edge of rectEdges) {
    if (doLineSegmentsIntersect(p1, p2, edge.p1, edge.p2)) {
      return true;
    }
  }

  return false;
};

/**
 * Determines if a circle intersects with a rectangle
 */
const circleIntersectsRect = (
  center: Point,
  radius: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): boolean => {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(minX, Math.min(center.x, maxX));
  const closestY = Math.max(minY, Math.min(center.y, maxY));

  // Calculate distance from closest point to circle center
  const distX = center.x - closestX;
  const distY = center.y - closestY;
  const distSquared = distX * distX + distY * distY;

  // Circle intersects if the closest point is within its radius
  return distSquared <= radius * radius;
};

/**
 * Determines if two line segments intersect
 */
const doLineSegmentsIntersect = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): boolean => {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  // Check if line segments intersect
  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  // Check for colinearity and overlap
  if (d1 === 0 && isPointOnSegment(p3, p4, p1)) return true;
  if (d2 === 0 && isPointOnSegment(p3, p4, p2)) return true;
  if (d3 === 0 && isPointOnSegment(p1, p2, p3)) return true;
  if (d4 === 0 && isPointOnSegment(p1, p2, p4)) return true;

  return false;
};

/**
 * Helper for line intersection algorithm
 */
const direction = (p1: Point, p2: Point, p3: Point): number => {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
};

/**
 * Determines if a point lies on a line segment
 */
const isPointOnSegment = (p1: Point, p2: Point, p: Point): boolean => {
  return (
    p.x >= Math.min(p1.x, p2.x) &&
    p.x <= Math.max(p1.x, p2.x) &&
    p.y >= Math.min(p1.y, p2.y) &&
    p.y <= Math.max(p1.y, p2.y)
  );
};

/**
 * Determines if a point is inside a rectangle
 */
const isPointInRect = (
  point: Point,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): boolean => {
  return (
    point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
  );
};

/**
 * Creates initial area selection state
 */
export const createInitialAreaSelectionState = (): AreaSelectionState => {
  return {
    active: false,
    startPoint: null,
    endPoint: null,
    selectionMode: 'window', // default is window (drag right)
  };
};

/**
 * Starts area selection on mouse down
 */
export const startAreaSelection = (
  e: React.MouseEvent<HTMLCanvasElement>,
  scale: number,
  offset: Point,
  setAreaSelection: React.Dispatch<React.SetStateAction<AreaSelectionState>>
): void => {
  // Get mouse coordinates relative to canvas
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Convert mouse coordinates to world coordinates
  const worldPoint = canvasToWorld({
    point: { x: mouseX, y: mouseY },
    scale,
    offset,
  });

  setAreaSelection({
    active: true,
    startPoint: worldPoint,
    endPoint: worldPoint, // Initially the same as start
    selectionMode: 'window', // Will be updated on mouse move
  });
};

/**
 * Updates area selection on mouse move
 */
export const updateAreaSelection = (
  e: React.MouseEvent<HTMLCanvasElement>,
  scale: number,
  offset: Point,
  areaSelection: AreaSelectionState,
  setAreaSelection: React.Dispatch<React.SetStateAction<AreaSelectionState>>
): void => {
  if (!areaSelection.active || !areaSelection.startPoint) return;

  // Get mouse coordinates relative to canvas
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Convert mouse coordinates to world coordinates
  const worldPoint = canvasToWorld({
    point: { x: mouseX, y: mouseY },
    scale,
    offset,
  });

  // Determine selection mode based on drag direction
  // If dragging right (x increasing), use window selection (fully contained)
  // If dragging left (x decreasing), use crossing selection (intersecting)
  const selectionMode =
    worldPoint.x >= areaSelection.startPoint.x ? 'window' : 'crossing';

  setAreaSelection({
    ...areaSelection,
    endPoint: worldPoint,
    selectionMode,
  });
};

/**
 * Completes area selection on mouse up and returns selected shape IDs
 */
export const completeAreaSelection = (
  shapes: Shape[],
  areaSelection: AreaSelectionState,
  setAreaSelection: React.Dispatch<React.SetStateAction<AreaSelectionState>>,
  isShiftSelect: boolean
): string[] => {
  if (
    !areaSelection.active ||
    !areaSelection.startPoint ||
    !areaSelection.endPoint
  ) {
    return [];
  }

  // Find shapes within selection area
  const selectedShapeIds = shapes
    .filter((shape) =>
      isShapeInSelectionArea(
        shape,
        areaSelection.startPoint!,
        areaSelection.endPoint!,
        areaSelection.selectionMode
      )
    )
    .map((shape) => shape.id);

  // Reset area selection
  setAreaSelection(createInitialAreaSelectionState());

  return selectedShapeIds;
};

/**
 * Renders the selection area on the canvas
 */
export const renderAreaSelection = (
  ctx: CanvasRenderingContext2D,
  areaSelection: AreaSelectionState,
  scale: number,
  offset: Point
): void => {
  if (
    !areaSelection.active ||
    !areaSelection.startPoint ||
    !areaSelection.endPoint
  )
    return;

  // Calculate canvas coordinates
  const canvasStart = {
    x: (areaSelection.startPoint.x + offset.x) * scale,
    y: (areaSelection.startPoint.y + offset.y) * scale,
  };

  const canvasEnd = {
    x: (areaSelection.endPoint.x + offset.x) * scale,
    y: (areaSelection.endPoint.y + offset.y) * scale,
  };

  const width = canvasEnd.x - canvasStart.x;
  const height = canvasEnd.y - canvasStart.y;

  // Save current context state
  ctx.save();

  // Set styles based on selection mode
  if (areaSelection.selectionMode === 'window') {
    // Window selection - blue, solid
    ctx.strokeStyle = 'rgb(0, 100, 255)';
    ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
  } else {
    // Crossing selection - green, dashed
    ctx.strokeStyle = 'rgb(50, 150, 50)';
    ctx.fillStyle = 'rgba(50, 150, 50, 0.1)';
    ctx.setLineDash([5, 5]);
  }

  ctx.lineWidth = 1;

  // Draw selection rectangle
  ctx.beginPath();
  ctx.rect(canvasStart.x, canvasStart.y, width, height);
  ctx.fill();
  ctx.stroke();

  // Restore context state
  ctx.restore();
};
