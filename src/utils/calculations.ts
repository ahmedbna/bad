import { Doc, Id } from '@/convex/_generated/dataModel';
import { Point } from '@/types';

/**
 * Calculate distance between two points
 */
export const calculateDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate angle between two points (in radians)
 */
export const angleBetweenPoints = (center: Point, p: Point): number => {
  return Math.atan2(p.y - center.y, p.x - center.x);
};

/**
 * Normalize angle to [0, 2π]
 */
export const normalizeAngle = (angle: number): number => {
  return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
};

/**
 * Calculate perpendicular distance from a point to a line through origin at given angle
 */
export const calculatePerpendicularDistance = (
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
 * Calculate the center of an arc passing through three points
 */
export const calculateArcCenter = (
  p1: Point,
  p2: Point,
  p3: Point
): Point | null => {
  // Check if points are collinear
  const slope1 = (p2.y - p1.y) / (p2.x - p1.x);
  const slope2 = (p3.y - p2.y) / (p3.x - p2.x);

  if (Math.abs(slope1 - slope2) < 0.0001) {
    return null; // Points are collinear
  }

  // Calculate perpendicular bisector of p1-p2
  const midPoint1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const perpSlope1 = (p1.x - p2.x) / (p2.y - p1.y);

  // Calculate perpendicular bisector of p2-p3
  const midPoint2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
  const perpSlope2 = (p2.x - p3.x) / (p3.y - p2.y);

  // Handle vertical slopes
  if (!isFinite(perpSlope1)) {
    const x = midPoint1.x;
    const y = perpSlope2 * (x - midPoint2.x) + midPoint2.y;
    return { x, y };
  }

  if (!isFinite(perpSlope2)) {
    const x = midPoint2.x;
    const y = perpSlope1 * (x - midPoint1.x) + midPoint1.y;
    return { x, y };
  }

  // Calculate intersection of the two perpendicular bisectors
  const x =
    (midPoint2.y -
      midPoint1.y +
      perpSlope1 * midPoint1.x -
      perpSlope2 * midPoint2.x) /
    (perpSlope1 - perpSlope2);
  const y = perpSlope1 * (x - midPoint1.x) + midPoint1.y;

  return { x, y };
};

/**
 * Calculate radius from a bulge point
 */
export const calculateRadiusFromBulge = (
  startPoint: Point,
  endPoint: Point,
  bulgePoint: Point
): number => {
  const center = calculateArcCenter(startPoint, bulgePoint, endPoint);
  if (!center) return 0;

  return calculateDistance(center, startPoint);
};

/**
 * Check if an angle is between two other angles
 */
export const isAngleBetween = (
  angle: number,
  start: number,
  end: number
): boolean => {
  // Normalize angles to [0, 2π]
  const normAngle = normalizeAngle(angle);
  const normStart = normalizeAngle(start);
  const normEnd = normalizeAngle(end);

  if (normStart <= normEnd) {
    return normAngle >= normStart && normAngle <= normEnd;
  } else {
    return normAngle >= normStart || normAngle <= normEnd;
  }
};

/**
 * Calculate arc parameters from start, end, and bulge point
 */
export const calculateArcFromStartEndBulge = (
  startPoint: Point,
  endPoint: Point,
  bulgePoint: Point
) => {
  const center = calculateArcCenter(startPoint, bulgePoint, endPoint);
  if (!center) {
    return { center: null, startAngle: 0, endAngle: 0, isClockwise: false };
  }

  const radius = calculateDistance(center, startPoint);
  const startAngle = angleBetweenPoints(center, startPoint);
  const endAngle = angleBetweenPoints(center, endPoint);
  const bulgeAngle = angleBetweenPoints(center, bulgePoint);

  // Determine if arc goes clockwise or counterclockwise
  const isClockwise = !isAngleBetween(bulgeAngle, startAngle, endAngle);

  // Adjust end angle for proper arc direction
  let adjustedEndAngle = endAngle;
  if (isClockwise && endAngle > startAngle) {
    adjustedEndAngle = endAngle - 2 * Math.PI;
  } else if (!isClockwise && endAngle < startAngle) {
    adjustedEndAngle = endAngle + 2 * Math.PI;
  }

  return {
    center,
    radius,
    startAngle,
    endAngle: adjustedEndAngle,
    isClockwise,
  };
};

/**
 * Calculate arc parameters from start, end, and direction
 */
export const calculateArcFromStartEndDirection = (
  startPoint: Point,
  endPoint: Point,
  dirAngle: number
) => {
  // Direction vector from start point
  const dirX = Math.cos(dirAngle);
  const dirY = Math.sin(dirAngle);

  // Midpoint of start-end line
  const midPoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  };

  // Vector from start to end
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate perpendicular bisector direction
  const perpX = -dy;
  const perpY = dx;

  // Try different distances along the perpendicular bisector
  let bestCenter: Point | null = null;
  let bestError = Infinity;
  let bestRadius = 0;
  let bestStartAngle = 0;
  let bestEndAngle = 0;
  let isClockwise = false;

  // Test a range of potential centers
  for (let t = -100; t <= 100; t += 0.5) {
    const testCenter = {
      x: midPoint.x + (perpX * t) / distance,
      y: midPoint.y + (perpY * t) / distance,
    };

    const centerToStart = {
      x: startPoint.x - testCenter.x,
      y: startPoint.y - testCenter.y,
    };

    // Calculate how perpendicular the direction is to center-to-start
    const dotProduct = centerToStart.x * dirX + centerToStart.y * dirY;
    const error = Math.abs(dotProduct);

    if (error < bestError) {
      bestError = error;
      bestCenter = testCenter;
      bestRadius = calculateDistance(testCenter, startPoint);
      bestStartAngle = angleBetweenPoints(testCenter, startPoint);
      bestEndAngle = angleBetweenPoints(testCenter, endPoint);
    }
  }

  if (bestError > 0.1 || !bestCenter) {
    return {
      center: null,
      radius: 0,
      startAngle: 0,
      endAngle: 0,
      isClockwise: false,
    };
  }

  // Determine direction (clockwise/counterclockwise)
  // For direction-based arcs, we need to check which way the arc should go
  // based on the start direction and end point position
  const dirToEnd = {
    x: endPoint.x - startPoint.x,
    y: endPoint.y - startPoint.y,
  };

  // Get cross product to determine which side the end point is on
  const crossProduct = dirX * dirToEnd.y - dirY * dirToEnd.x;
  isClockwise = crossProduct < 0;

  // Calculate sweep angle
  let sweepAngle;
  if (isClockwise) {
    sweepAngle =
      bestStartAngle > bestEndAngle
        ? bestStartAngle - bestEndAngle
        : bestStartAngle - bestEndAngle + 2 * Math.PI;
  } else {
    sweepAngle =
      bestEndAngle > bestStartAngle
        ? bestEndAngle - bestStartAngle
        : bestEndAngle - bestStartAngle + 2 * Math.PI;
  }

  // Adjust end angle for proper arc direction
  const adjustedEndAngle = isClockwise
    ? normalizeAngle(bestStartAngle - sweepAngle)
    : normalizeAngle(bestStartAngle + sweepAngle);

  return {
    center: bestCenter,
    radius: bestRadius,
    startAngle: bestStartAngle,
    endAngle: adjustedEndAngle,
    isClockwise,
  };
};

/**
 * Find possible arc centers given two points and a radius
 */
export const findArcCentersFromRadius = (
  p1: Point,
  p2: Point,
  radius: number
): Point[] => {
  // Find midpoint between p1 and p2
  const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  // Calculate distance between points
  const distance = calculateDistance(p1, p2);

  // Check if radius is valid
  if (radius < distance / 2) {
    return []; // Radius too small
  }

  // Calculate the height of the triangle
  const h = Math.sqrt(radius * radius - (distance * distance) / 4);

  // Direction vector from p1 to p2
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Perpendicular direction
  const perpDx = -dy;
  const perpDy = dx;

  // Normalize
  const length = Math.sqrt(perpDx * perpDx + perpDy * perpDy);
  const normPerpDx = perpDx / length;
  const normPerpDy = perpDy / length;

  // Calculate the two center points
  const center1: Point = {
    x: midPoint.x + normPerpDx * h,
    y: midPoint.y + normPerpDy * h,
  };

  const center2: Point = {
    x: midPoint.x - normPerpDx * h,
    y: midPoint.y - normPerpDy * h,
  };

  return [center1, center2];
};

/**
 * Calculate sweep angle based on start angle, end angle, and direction
 */
export const calculateSweepAngle = (
  startAngle: number,
  endAngle: number,
  isClockwise: boolean
): number => {
  const normStart = normalizeAngle(startAngle);
  const normEnd = normalizeAngle(endAngle);

  if (isClockwise) {
    return normStart > normEnd
      ? normStart - normEnd
      : normStart - normEnd + 2 * Math.PI;
  } else {
    return normEnd > normStart
      ? normEnd - normStart
      : normEnd - normStart + 2 * Math.PI;
  }
};

/**
 * Calculate angle based on start angle and sweep angle
 */
export const calculateEndAngleFromSweep = (
  startAngle: number,
  sweepAngle: number,
  isClockwise: boolean
): number => {
  const normStart = normalizeAngle(startAngle);

  if (isClockwise) {
    return normalizeAngle(normStart - sweepAngle);
  } else {
    return normalizeAngle(normStart + sweepAngle);
  }
};

/**
 * Calculate point at a specific angle and distance from center
 */
export const pointOnCircle = (
  center: Point,
  radius: number,
  angle: number
): Point => {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
};

/**
 * Calculate point on arc at specific parameter t (0 to 1)
 */
export const pointOnArc = (
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  isClockwise: boolean,
  t: number
): Point => {
  // Ensure t is between 0 and 1
  t = Math.max(0, Math.min(1, t));

  // Calculate sweep angle
  const sweepAngle = calculateSweepAngle(startAngle, endAngle, isClockwise);

  // Calculate the angle at parameter t
  const angle = isClockwise
    ? normalizeAngle(startAngle - t * sweepAngle)
    : normalizeAngle(startAngle + t * sweepAngle);

  // Return point on circle at calculated angle
  return pointOnCircle(center, radius, angle);
};

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Calculate the angle in radians from the positive x-axis to the line formed by two points
 * @param p1 The reference point
 * @param p2 The target point
 * @returns The angle in radians (0 to 2π)
 */
export function angleFromPoints(p1: Point, p2: Point): number {
  // Calculate the angle using Math.atan2
  // atan2 returns angle in range -π to π, with 0 at positive x-axis
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  // Convert to range 0 to 2π if negative
  if (angle < 0) {
    angle += 2 * Math.PI;
  }

  return angle;
}

/**
 * Calculate the intersection points between two shapes
 * @param shape1 First shape
 * @param shape2 Second shape
 * @returns Array of intersection points
 */
export function intersectShapes(
  shape1: Doc<'shapes'>,
  shape2: Doc<'shapes'>
): Point[] {
  // Line-Line intersection
  if (shape1.type === 'line' && shape2.type === 'line') {
    return intersectLineLine(shape1, shape2);
  }

  // Line-Arc intersection
  if (shape1.type === 'line' && shape2.type === 'arc') {
    return intersectLineArc(shape1, shape2);
  }

  // Arc-Line intersection
  if (shape1.type === 'arc' && shape2.type === 'line') {
    return intersectLineArc(shape2, shape1);
  }

  // Arc-Arc intersection
  if (shape1.type === 'arc' && shape2.type === 'arc') {
    return intersectArcArc(shape1, shape2);
  }

  // Handle line-polyline intersection
  if (shape1.type === 'line' && shape2.type === 'polyline') {
    return intersectLinePolyline(shape1, shape2);
  }

  // Handle polyline-line intersection
  if (shape1.type === 'polyline' && shape2.type === 'line') {
    return intersectLinePolyline(shape2, shape1);
  }

  // Default: no intersection
  return [];
}

/**
 * Calculate intersection between two line segments
 */
function intersectLineLine(
  line1: Doc<'shapes'>,
  line2: Doc<'shapes'>
): Point[] {
  if (line1.points.length < 2 || line2.points.length < 2) {
    return [];
  }

  const p1 = line1.points[0];
  const p2 = line1.points[1];
  const p3 = line2.points[0];
  const p4 = line2.points[1];

  // Calculate line parameters
  const denominator =
    (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  // Check if lines are parallel (denominator = 0)
  if (Math.abs(denominator) < 0.00001) {
    return [];
  }

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
    denominator;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
    denominator;

  // Check if intersection point is within both line segments
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    const intersectionX = p1.x + ua * (p2.x - p1.x);
    const intersectionY = p1.y + ua * (p2.y - p1.y);

    return [{ x: intersectionX, y: intersectionY }];
  }

  return [];
}

/**
 * Calculate intersection between a line and an arc
 */
function intersectLineArc(line: Doc<'shapes'>, arc: Doc<'shapes'>): Point[] {
  if (line.points.length < 2 || arc.points.length < 1) {
    return [];
  }

  const lineStart = line.points[0];
  const lineEnd = line.points[1];
  const center = arc.points[0];

  // Get arc radius
  const radius =
    arc.properties?.radius ||
    (arc.points.length > 1 ? calculateDistance(center, arc.points[1]) : 0);

  // Get arc angles
  const startAngle = arc.properties?.startAngle || 0;
  const endAngle = arc.properties?.endAngle || Math.PI * 2;

  // Convert line to parametric equation: p = p1 + t(p2-p1)
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // Calculate distance from center to line
  const a = dx * dx + dy * dy;
  const b = 2 * ((lineStart.x - center.x) * dx + (lineStart.y - center.y) * dy);
  const c =
    (lineStart.x - center.x) * (lineStart.x - center.x) +
    (lineStart.y - center.y) * (lineStart.y - center.y) -
    radius * radius;

  // Calculate discriminant
  const discriminant = b * b - 4 * a * c;

  // Check if line intersects circle
  if (discriminant < 0) {
    return []; // No intersection
  }

  // Calculate intersection points
  const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

  const intersections: Point[] = [];

  // Check if intersection points are on the line segment
  if (t1 >= 0 && t1 <= 1) {
    const p1 = {
      x: lineStart.x + t1 * dx,
      y: lineStart.y + t1 * dy,
    };

    // Check if intersection is within arc angle range
    const angle = angleFromPoints(center, p1);
    if (isAngleInRange(angle, startAngle, endAngle)) {
      intersections.push(p1);
    }
  }

  if (t2 >= 0 && t2 <= 1) {
    const p2 = {
      x: lineStart.x + t2 * dx,
      y: lineStart.y + t2 * dy,
    };

    // Check if intersection is within arc angle range
    const angle = angleFromPoints(center, p2);
    if (isAngleInRange(angle, startAngle, endAngle)) {
      intersections.push(p2);
    }
  }

  return intersections;
}

/**
 * Calculate intersection between two arcs
 */
function intersectArcArc(arc1: Doc<'shapes'>, arc2: Doc<'shapes'>): Point[] {
  const center1 = arc1.points[0];
  const center2 = arc2.points[0];

  // Get radii
  const radius1 =
    arc1.properties?.radius ||
    (arc1.points.length > 1 ? calculateDistance(center1, arc1.points[1]) : 0);
  const radius2 =
    arc2.properties?.radius ||
    (arc2.points.length > 1 ? calculateDistance(center2, arc2.points[1]) : 0);

  // Get arc angles
  const startAngle1 = arc1.properties?.startAngle || 0;
  const endAngle1 = arc1.properties?.endAngle || Math.PI * 2;
  const startAngle2 = arc2.properties?.startAngle || 0;
  const endAngle2 = arc2.properties?.endAngle || Math.PI * 2;

  // Calculate distance between centers
  const centerDistance = calculateDistance(center1, center2);

  // Check if circles are too far apart or one is inside the other
  if (
    centerDistance > radius1 + radius2 ||
    centerDistance < Math.abs(radius1 - radius2)
  ) {
    return []; // No intersection
  }

  // Check if circles are coincident
  if (centerDistance < 0.00001 && Math.abs(radius1 - radius2) < 0.00001) {
    return []; // Infinite intersection points (not handled)
  }

  // Calculate intersection points
  const a =
    (radius1 * radius1 - radius2 * radius2 + centerDistance * centerDistance) /
    (2 * centerDistance);
  const h = Math.sqrt(radius1 * radius1 - a * a);

  const p2 = {
    x: center1.x + (a * (center2.x - center1.x)) / centerDistance,
    y: center1.y + (a * (center2.y - center1.y)) / centerDistance,
  };

  const intersections: Point[] = [];

  // Calculate the two intersection points
  const intersection1 = {
    x: p2.x + (h * (center2.y - center1.y)) / centerDistance,
    y: p2.y - (h * (center2.x - center1.x)) / centerDistance,
  };

  const intersection2 = {
    x: p2.x - (h * (center2.y - center1.y)) / centerDistance,
    y: p2.y + (h * (center2.x - center1.x)) / centerDistance,
  };

  // Check if intersection points are within both arcs' angles
  const angle1_1 = angleFromPoints(center1, intersection1);
  const angle2_1 = angleFromPoints(center2, intersection1);

  if (
    isAngleInRange(angle1_1, startAngle1, endAngle1) &&
    isAngleInRange(angle2_1, startAngle2, endAngle2)
  ) {
    intersections.push(intersection1);
  }

  const angle1_2 = angleFromPoints(center1, intersection2);
  const angle2_2 = angleFromPoints(center2, intersection2);

  if (
    isAngleInRange(angle1_2, startAngle1, endAngle1) &&
    isAngleInRange(angle2_2, startAngle2, endAngle2)
  ) {
    intersections.push(intersection2);
  }

  return intersections;
}

/**
 * Calculate intersection between a line and a polyline
 */
function intersectLinePolyline(
  line: Doc<'shapes'>,
  polyline: Doc<'shapes'>
): Point[] {
  const intersections: Point[] = [];

  // Create line segments from polyline points
  for (let i = 1; i < polyline.points.length; i++) {
    const lineSegment: Doc<'shapes'> = {
      _id: `temp-${Date.now()}` as Id<'shapes'>,
      _creationTime: Date.now(),
      projectId: `temp-pro-${Date.now()}` as Id<'projects'>,
      userId: `temp-usr-${Date.now()}` as Id<'users'>,
      type: 'line',
      points: [polyline.points[i - 1], polyline.points[i]],
      properties: {},
    };

    // Find intersections with this segment
    const segmentIntersections = intersectLineLine(line, lineSegment);
    intersections.push(...segmentIntersections);
  }

  return intersections;
}

/**
 * Check if an angle is within a given range
 * Handles ranges that wrap around 2π
 */
function isAngleInRange(
  angle: number,
  startAngle: number,
  endAngle: number
): boolean {
  // Normalize angles to [0, 2π]
  const normalizedAngle =
    ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const normalizedStart =
    ((startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const normalizedEnd =
    ((endAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  // Handle cases where the arc crosses the 0/2π boundary
  if (normalizedStart <= normalizedEnd) {
    return (
      normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd
    );
  } else {
    return (
      normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd
    );
  }
}
