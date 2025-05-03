import { Point } from '@/types/point';

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

// Function to calculate the center of an arc passing through three points
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

// Calculate radius from a bulge point
export const calculateRadiusFromBulge = (
  startPoint: Point,
  endPoint: Point,
  bulgePoint: Point
): number => {
  const center = calculateArcCenter(startPoint, bulgePoint, endPoint);
  if (!center) return 0;

  return calculateDistance(center, startPoint);
};

// Helper function to check if an angle is between two other angles
export const isAngleBetween = (
  angle: number,
  start: number,
  end: number
): boolean => {
  // Normalize angles to [0, 2π]
  const normalizeAngle = (a: number) =>
    ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  const normAngle = normalizeAngle(angle);
  const normStart = normalizeAngle(start);
  const normEnd = normalizeAngle(end);

  if (normStart <= normEnd) {
    return normAngle >= normStart && normAngle <= normEnd;
  } else {
    return normAngle >= normStart || normAngle <= normEnd;
  }
};

// Calculate arc parameters from start, end, and bulge point
export const calculateArcFromStartEndBulge = (
  startPoint: Point,
  endPoint: Point,
  bulgePoint: Point
) => {
  const center = calculateArcCenter(startPoint, bulgePoint, endPoint);
  if (!center) {
    return { center: null, startAngle: 0, endAngle: 0 };
  }

  const radius = calculateDistance(center, startPoint);
  const startAngle = angleBetweenPoints(center, startPoint);
  const endAngle = angleBetweenPoints(center, endPoint);

  // Determine if arc goes clockwise or counterclockwise
  const bulgeAngle = angleBetweenPoints(center, bulgePoint);
  const isClockwise = !isAngleBetween(bulgeAngle, startAngle, endAngle);

  // Adjust end angle for proper arc direction
  let adjustedEndAngle = endAngle;
  if (isClockwise && endAngle > startAngle) {
    adjustedEndAngle = endAngle - 2 * Math.PI;
  } else if (!isClockwise && endAngle < startAngle) {
    adjustedEndAngle = endAngle + 2 * Math.PI;
  }

  return { center, startAngle, endAngle: adjustedEndAngle };
};

// Calculate arc parameters from start, end, and direction
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

  // Direction from start point is perpendicular to the center-to-start vector
  // So center-to-start is perpendicular to the direction
  // Using dot product: (center-start)·dir = 0
  // (center.x - start.x)*dirX + (center.y - start.y)*dirY = 0

  // Parameterize the perpendicular bisector: midPoint + t * perpDirection
  // This gives us potential centers

  // Solving for the parameter t where the center's position satisfies the perpendicular relationship
  // This is a complex calculation involving determining where the perpendicular bisector
  // intersects with the line going through startPoint in the dirAngle direction

  // For simplicity, we'll use a numerical approach with two candidate centers

  // Try different distances along the perpendicular bisector
  let bestCenter: Point | null = null;
  let bestError = Infinity;
  let bestRadius = 0;
  let bestStartAngle = 0;
  let bestEndAngle = 0;

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
    return { center: null, radius: 0, startAngle: 0, endAngle: 0 };
  }

  return {
    center: bestCenter,
    radius: bestRadius,
    startAngle: bestStartAngle,
    endAngle: bestEndAngle,
  };
};

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
