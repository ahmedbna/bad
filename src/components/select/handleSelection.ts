import { Point } from '@/types/';
import { Shape } from '@/types';
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

  // Early exit if click is outside the canvas bounds
  if (mouseX < 0 || mouseY < 0 || mouseX > rect.width || mouseY > rect.height) {
    return;
  }

  const worldPoint = canvasToWorld({
    point: { x: mouseX, y: mouseY },
    scale,
    offset,
  });

  // Check if shift key is pressed for removing from selection
  const isShiftSelect = e.shiftKey;

  // Find clicked shape
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];

    if (isPointOnShape(worldPoint, shape, scale)) {
      setSelectedShapes((prev) => {
        // If the shape is already selected and shift is pressed, remove it
        if (prev.includes(shape.id) && isShiftSelect) {
          return prev.filter((id) => id !== shape.id);
        }

        // If the shape is not selected, add it to selection (multi-select is default)
        if (!prev.includes(shape.id)) {
          return [...prev, shape.id];
        }

        // Otherwise keep the current selection
        return prev;
      });
      return;
    }
  }
};

// Check if point is in shape
const isPointOnShape = (point: Point, shape: Shape, scale: number): boolean => {
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

    case 'arc':
      if (
        shape.points.length < 1 ||
        !shape.properties?.radius ||
        shape.properties?.startAngle === undefined ||
        shape.properties?.endAngle === undefined
      ) {
        return false;
      }
      return isPointOnArc(
        point,
        shape.points[0],
        shape.properties.radius,
        shape.properties.startAngle,
        shape.properties.endAngle,
        scale
      );

    case 'ellipse':
      if (
        shape.points.length < 1 ||
        shape.properties?.radiusX === undefined ||
        shape.properties?.radiusY === undefined ||
        shape.properties?.rotation === undefined
      ) {
        return false;
      }
      return isPointOnEllipse(
        point,
        shape.points[0],
        shape.properties.radiusX,
        shape.properties.radiusY,
        shape.properties.rotation,
        shape.properties?.isFullEllipse,
        scale
      );

    case 'polygon':
      if (
        shape.points.length < 1 ||
        shape.properties?.radius === undefined ||
        shape.properties?.sides === undefined
      ) {
        return false;
      }
      return isPointInPolygon(
        point,
        shape.points[0],
        shape.properties.radius,
        shape.properties.sides,
        scale
      );

    case 'spline':
      if (shape.points.length < 3) return false;
      return isPointOnSpline(
        point,
        shape.points,
        shape.properties?.tension || 0.5,
        scale
      );

    case 'text':
      if (shape.points.length < 1 || !shape.properties.textParams?.content)
        return false;
      return isPointInTextBounds(
        point,
        shape.points[0],
        shape.properties.textParams?.content || '',
        shape.properties?.textParams?.fontSize || 12,
        shape.properties?.rotation || 0,
        scale
      );

    case 'dimension':
      if (
        shape.points.length < 2 ||
        shape.properties?.dimensionParams?.offset === undefined
      ) {
        return false;
      }
      return isPointOnDimension(
        point,
        shape.points[0],
        shape.points[1],
        shape.properties.dimensionParams.offset,
        shape.properties?.dimensionParams?.value.toString() || '',
        scale
      );

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

// Check if point is on arc
const isPointOnArc = (
  point: Point,
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  scale: number
): boolean => {
  const tolerance = 5 / scale; // 5px in screen coordinates

  // Calculate distance from point to center
  const d = distance(point, center);

  // Check if the point is at the right distance from center (near the arc)
  if (Math.abs(d - radius) > tolerance) {
    return false;
  }

  // Calculate angle from center to point
  const angle = Math.atan2(point.y - center.y, point.x - center.x);

  // Normalize angles to [0, 2π] for easier comparison
  const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
  let normalizedStart = (startAngle + 2 * Math.PI) % (2 * Math.PI);
  let normalizedEnd = (endAngle + 2 * Math.PI) % (2 * Math.PI);

  // Handle case where end angle is smaller than start angle (arc crosses 0°)
  if (normalizedEnd < normalizedStart) {
    normalizedEnd += 2 * Math.PI;
  }

  // Check if point's angle is between start and end angles
  return (
    normalizedAngle >= normalizedStart - tolerance &&
    normalizedAngle <= normalizedEnd + tolerance
  );
};

// Check if point is on ellipse
const isPointOnEllipse = (
  point: Point,
  center: Point,
  radiusX: number,
  radiusY: number,
  rotation: number,
  isFullEllipse: boolean | undefined,
  scale: number
): boolean => {
  const tolerance = 5 / scale; // 5px in screen coordinates

  // Translate to origin
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  // Rotate point to align with ellipse axes
  const rotatedX = dx * Math.cos(-rotation) - dy * Math.sin(-rotation);
  const rotatedY = dx * Math.sin(-rotation) + dy * Math.cos(-rotation);

  // Calculate normalized distance from ellipse
  // (x/a)² + (y/b)² = 1 is the equation of an ellipse
  const normalizedDistance = Math.sqrt(
    Math.pow(rotatedX / radiusX, 2) + Math.pow(rotatedY / radiusY, 2)
  );

  // Point is on ellipse if the normalized distance is approximately 1
  return (
    Math.abs(normalizedDistance - 1) < tolerance / Math.min(radiusX, radiusY)
  );
};

// Check if point is in polygon
const isPointInPolygon = (
  point: Point,
  center: Point,
  radius: number,
  sides: number,
  scale: number
): boolean => {
  const tolerance = 5 / scale; // 5px in screen coordinates

  // Generate polygon vertices
  const vertices: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    vertices.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }

  // Check if point is on any edge
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    if (isPointOnLine(point, vertices[i], vertices[j], scale)) {
      return true;
    }
  }

  // Check if point is inside polygon
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = sides - 1; i < sides; j = i++) {
    const intersect =
      vertices[i].y > point.y !== vertices[j].y > point.y &&
      point.x <
        ((vertices[j].x - vertices[i].x) * (point.y - vertices[i].y)) /
          (vertices[j].y - vertices[i].y) +
          vertices[i].x;

    if (intersect) inside = !inside;
  }

  return inside;
};

// Check if point is on spline
const isPointOnSpline = (
  point: Point,
  splinePoints: Point[],
  tension: number,
  scale: number
): boolean => {
  const tolerance = 5 / scale; // 5px in screen coordinates

  // For simplicity, we'll check if the point is near any of the control points
  // or near the approximate curved segments

  // Check control points
  for (const splinePoint of splinePoints) {
    if (distance(point, splinePoint) < tolerance) {
      return true;
    }
  }

  // Check segments with a linear approximation approach
  // (We're simplifying here - a proper implementation would use
  // the actual spline curve equations)
  const steps = 10; // Number of linear segments to approximate each curve segment

  for (let i = 0; i < splinePoints.length - 1; i++) {
    const p1 = splinePoints[i];
    const p2 = splinePoints[i + 1];

    // Linear approximation of the curve segment
    for (let step = 0; step < steps; step++) {
      const t1 = step / steps;
      const t2 = (step + 1) / steps;

      // Linear interpolation for a simple approximation
      const pt1 = {
        x: p1.x + (p2.x - p1.x) * t1,
        y: p1.y + (p2.y - p1.y) * t1,
      };

      const pt2 = {
        x: p1.x + (p2.x - p1.x) * t2,
        y: p1.y + (p2.y - p1.y) * t2,
      };

      if (isPointOnLine(point, pt1, pt2, scale)) {
        return true;
      }
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

// Helper function to check if a point is within text bounds
const isPointInTextBounds = (
  point: Point,
  position: Point,
  text: string,
  fontSize: number,
  rotation: number,
  scale: number
): boolean => {
  // Calculate text metrics
  // We'll use a rough approximation based on font size
  const charWidth = fontSize * 0.6; // Approximate character width
  const textWidth = text.length * charWidth;
  const textHeight = fontSize;

  // Define selection tolerance (scaled by current zoom level)
  const tolerance = 5 / scale;

  // Create a bounding rectangle for the text
  const halfWidth = textWidth / 2;
  const halfHeight = textHeight / 2;

  // If no rotation, use simplified rectangle check
  if (rotation === 0) {
    return (
      point.x >= position.x - tolerance &&
      point.x <= position.x + textWidth + tolerance &&
      point.y >= position.y - textHeight - tolerance &&
      point.y <= position.y + tolerance
    );
  }

  // For rotated text, we need to transform the point to the text's coordinate system
  const rotationInRadians = rotation * (Math.PI / 180);
  const dx = point.x - position.x;
  const dy = point.y - position.y;

  // Apply inverse rotation to the point
  const rotatedX =
    dx * Math.cos(-rotationInRadians) - dy * Math.sin(-rotationInRadians);
  const rotatedY =
    dx * Math.sin(-rotationInRadians) + dy * Math.cos(-rotationInRadians);

  // Check if the point is within the text bounds after rotation
  return (
    rotatedX >= -tolerance &&
    rotatedX <= textWidth + tolerance &&
    rotatedY >= -textHeight - tolerance &&
    rotatedY <= tolerance
  );
};

// Helper function to check if a point is on a dimension object
const isPointOnDimension = (
  point: Point,
  start: Point,
  end: Point,
  offset: number,
  text: string | undefined,
  scale: number
): boolean => {
  // Calculate dimension line direction vector
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return false;

  // Normalize direction vector
  const unitX = dx / length;
  const unitY = dy / length;

  // Calculate perpendicular direction for extension lines
  const perpX = -unitY;
  const perpY = unitX;

  // Calculate dimension line points (perpendicular to the measured line)
  const dimStart = {
    x: start.x + perpX * offset,
    y: start.y + perpY * offset,
  };

  const dimEnd = {
    x: end.x + perpX * offset,
    y: end.y + perpY * offset,
  };

  // Define selection tolerance (scaled by current zoom level)
  const tolerance = 5 / scale;

  // Check if point is near the dimension line
  if (isPointOnLine(point, dimStart, dimEnd, scale)) {
    return true;
  }

  // Check if point is near the extension lines
  if (isPointOnLine(point, start, dimStart, scale)) {
    return true;
  }

  if (isPointOnLine(point, end, dimEnd, scale)) {
    return true;
  }

  // Check if point is near the text (if provided)
  if (text) {
    // Calculate midpoint for text position
    const textPosition = {
      x: (dimStart.x + dimEnd.x) / 2,
      y: (dimStart.y + dimEnd.y) / 2,
    };

    // Get rotation angle from dimension line direction
    const textRotation =
      Math.atan2(dimEnd.y - dimStart.y, dimEnd.x - dimStart.x) *
      (180 / Math.PI);

    // Check if point is near the text using our text bounds function
    return isPointInTextBounds(
      point,
      textPosition,
      text,
      12, // Default font size, adjust as needed
      textRotation,
      scale
    );
  }

  return false;
};
