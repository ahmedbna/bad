import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { canvasToWorld } from '@/utils/canvasToWorld';

type Props = {
  e: React.MouseEvent<HTMLCanvasElement>;
  scale: number;
  offset: Point;
  shapes: Shape[];
  setSelectedShapes: React.Dispatch<React.SetStateAction<string[]>>;
};

// Handle selection
export const handleSelection = ({
  e,
  scale,
  offset,
  shapes,
  setSelectedShapes,
}: Props) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const worldPoint = canvasToWorld({
    point: { x: mouseX, y: mouseY },
    scale,
    offset,
  });

  // Find clicked shape
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];

    if (isPointInShape(worldPoint, shape, scale)) {
      setSelectedShapes((pre) => [...pre, shape.id]);
      return;
    }
  }

  // If no shape found, clear selection
  setSelectedShapes([]);
};

// Check if point is in shape
const isPointInShape = (point: Point, shape: Shape, scale: number): boolean => {
  switch (shape.type) {
    case 'line':
      if (shape.points.length < 2) return false;
      return isPointOnLine(point, shape.points[0], shape.points[1], scale);

    case 'rectangle':
      if (shape.points.length < 2) return false;
      return isPointInRectangle(point, shape.points[0], shape.points[1], scale);

    case 'circle':
      if (shape.points.length < 1 || !shape.properties?.radius) return false;
      return isPointInCircle(
        point,
        shape.points[0],
        shape.properties.radius,
        scale
      );

    case 'polyline':
      if (shape.points.length < 2) return false;
      return isPointOnPolyline(point, shape.points, scale);

    default:
      return false;
  }
};

// Check if point is on line
const isPointOnLine = (
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  scale: number
): boolean => {
  const tolerance = 5 / scale; // 5px in screen coordinates

  const d1 = distance(point, lineStart);
  const d2 = distance(point, lineEnd);
  const lineLength = distance(lineStart, lineEnd);

  // Check if point is close to line segment
  return Math.abs(d1 + d2 - lineLength) < tolerance;
};

// Check if point is in rectangle
const isPointInRectangle = (
  point: Point,
  rectStart: Point,
  rectEnd: Point,
  scale: number
): boolean => {
  const tolerance = 5 / scale; // 5px in screen coordinates

  const minX = Math.min(rectStart.x, rectEnd.x);
  const maxX = Math.max(rectStart.x, rectEnd.x);
  const minY = Math.min(rectStart.y, rectEnd.y);
  const maxY = Math.max(rectStart.y, rectEnd.y);

  // Check if point is inside rectangle
  if (
    point.x >= minX &&
    point.x <= maxX &&
    point.y >= minY &&
    point.y <= maxY
  ) {
    return true;
  }

  // Check if point is close to rectangle edges
  if (
    (Math.abs(point.x - minX) < tolerance ||
      Math.abs(point.x - maxX) < tolerance) &&
    point.y >= minY &&
    point.y <= maxY
  ) {
    return true;
  }

  if (
    (Math.abs(point.y - minY) < tolerance ||
      Math.abs(point.y - maxY) < tolerance) &&
    point.x >= minX &&
    point.x <= maxX
  ) {
    return true;
  }

  return false;
};

// Check if point is in circle
const isPointInCircle = (
  point: Point,
  center: Point,
  radius: number,
  scale: number
): boolean => {
  const tolerance = 5 / scale; // 5px in screen coordinates
  const d = distance(point, center);

  return Math.abs(d - radius) < tolerance;
};

// Check if point is on polyline
const isPointOnPolyline = (
  point: Point,
  polylinePoints: Point[],
  scale: number
): boolean => {
  if (polylinePoints.length < 2) return false;

  // Check each segment of the polyline
  for (let i = 0; i < polylinePoints.length - 1; i++) {
    if (isPointOnLine(point, polylinePoints[i], polylinePoints[i + 1], scale)) {
      return true;
    }
  }

  return false;
};

// Calculate distance between two points
const distance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};
