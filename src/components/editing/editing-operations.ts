import { Point, Shape } from '@/types';
import {
  angleFromPoints,
  calculateDistance,
  intersectShapes,
} from '../../utils/calculations';

// Deep clone a shape
export function cloneShape(shape: Shape): Shape {
  return {
    ...shape,
    id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    points: [...shape.points.map((p) => ({ ...p }))],
    properties: { ...shape.properties },
  };
}

// Translate a shape by dx, dy
export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  const newShape = cloneShape(shape);
  newShape.points = newShape.points.map((point) => ({
    x: point.x + dx,
    y: point.y + dy,
  }));
  return newShape;
}

// Rotate a shape around a point
export function rotateShape(shape: Shape, center: Point, angle: number): Shape {
  const newShape = cloneShape(shape);
  newShape.points = newShape.points.map((point) => {
    // Translate point to origin
    const x = point.x - center.x;
    const y = point.y - center.y;

    // Rotate point
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const newX = x * cosA - y * sinA;
    const newY = x * sinA + y * cosA;

    // Translate point back
    return {
      x: newX + center.x,
      y: newY + center.y,
    };
  });
  return newShape;
}

// Create a mirrored copy of a shape across a line defined by two points
export function mirrorShape(shape: Shape, p1: Point, p2: Point): Shape {
  const newShape = cloneShape(shape);

  // Calculate the line's direction vector
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Calculate the line's normal
  const lineLength = Math.sqrt(dx * dx + dy * dy);
  const nx = dy / lineLength;
  const ny = -dx / lineLength;

  newShape.points = newShape.points.map((point) => {
    // Calculate the vector from p1 to the point
    const vx = point.x - p1.x;
    const vy = point.y - p1.y;

    // Calculate the projection of the vector onto the normal
    const dotProduct = vx * nx + vy * ny;

    // Reflect the point across the line
    return {
      x: point.x - 2 * dotProduct * nx,
      y: point.y - 2 * dotProduct * ny,
    };
  });

  return newShape;
}

// Create an offset of a shape (works for lines and arcs)
export function offsetShape(
  shape: Shape,
  distance: number,
  side: 'left' | 'right' | 'inner' | 'outer'
): Shape {
  const newShape = cloneShape(shape);

  // Handle different shape types
  switch (shape.type) {
    case 'line':
      if (shape.points.length < 2) return shape;

      const p1 = shape.points[0];
      const p2 = shape.points[1];

      // Calculate the line's direction vector
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;

      // Calculate the line's normal (perpendicular)
      const lineLength = Math.sqrt(dx * dx + dy * dy);
      const nx = dy / lineLength;
      const ny = -dx / lineLength;

      // Apply offset based on side
      const offset = side === 'left' ? distance : -distance;

      newShape.points = [
        { x: p1.x + nx * offset, y: p1.y + ny * offset },
        { x: p2.x + nx * offset, y: p2.y + ny * offset },
      ];
      return newShape;

    case 'arc':
      if (shape.points.length < 3) return shape;

      // For arcs, offset the radius
      const center = shape.points[0];
      const radius = calculateDistance(center, shape.points[1]);
      const startAngle = shape.properties?.startAngle || 0;
      const endAngle = shape.properties?.endAngle || Math.PI * 2;

      // Apply offset based on side
      const newRadius =
        side === 'outer' ? radius + distance : Math.max(radius - distance, 0.1);

      // Create a new arc with the modified radius
      return {
        ...newShape,
        points: [
          { ...center },
          {
            x: center.x + newRadius * Math.cos(startAngle),
            y: center.y + newRadius * Math.sin(startAngle),
          },
          {
            x: center.x + newRadius * Math.cos(endAngle),
            y: center.y + newRadius * Math.sin(endAngle),
          },
        ],
        properties: {
          ...newShape.properties,
          radius: newRadius,
          startAngle,
          endAngle,
        },
      };

    default:
      return shape;
  }
}

// Stretch a shape by moving selected points
export function stretchShape(
  shape: Shape,
  selectionArea: { start: Point; end: Point },
  basePoint: Point,
  targetPoint: Point
): Shape {
  const newShape = cloneShape(shape);

  // Calculate displacement vector
  const dx = targetPoint.x - basePoint.x;
  const dy = targetPoint.y - basePoint.y;

  // Calculate selection bounds
  const selectionMinX = Math.min(selectionArea.start.x, selectionArea.end.x);
  const selectionMaxX = Math.max(selectionArea.start.x, selectionArea.end.x);
  const selectionMinY = Math.min(selectionArea.start.y, selectionArea.end.y);
  const selectionMaxY = Math.max(selectionArea.start.y, selectionArea.end.y);

  // Stretch points that are within the selection area
  newShape.points = newShape.points.map((point) => {
    if (
      point.x >= selectionMinX &&
      point.x <= selectionMaxX &&
      point.y >= selectionMinY &&
      point.y <= selectionMaxY
    ) {
      // Move the point by the displacement vector
      return {
        x: point.x + dx,
        y: point.y + dy,
      };
    }
    return { ...point };
  });

  return newShape;
}

// Trim a shape at the intersection with another shape
export function trimShape(
  shape: Shape,
  cuttingShapes: Shape[],
  clickPoint: Point
): Shape | null {
  // Handle different shape types
  switch (shape.type) {
    case 'line':
      if (shape.points.length < 2) return shape;

      // Find all intersections
      const intersections: Point[] = [];
      cuttingShapes.forEach((cuttingShape) => {
        const points = intersectShapes(shape, cuttingShape);
        if (points.length > 0) {
          intersections.push(...points);
        }
      });

      if (intersections.length === 0) return shape;

      // Sort intersections by distance from line start
      const start = shape.points[0];
      const end = shape.points[1];
      const sortedIntersections = [...intersections].sort((a, b) => {
        const distA = calculateDistance(start, a);
        const distB = calculateDistance(start, b);
        return distA - distB;
      });

      // Find the closest intersection to the click point
      let closestIntersection = sortedIntersections[0];
      let minDistance = calculateDistance(clickPoint, closestIntersection);

      for (const intersection of sortedIntersections) {
        const distance = calculateDistance(clickPoint, intersection);
        if (distance < minDistance) {
          minDistance = distance;
          closestIntersection = intersection;
        }
      }

      // Determine which segment to keep based on distance from click point
      const distanceToStart = calculateDistance(clickPoint, start);
      const distanceToEnd = calculateDistance(clickPoint, end);

      const newShape = cloneShape(shape);
      if (distanceToStart < distanceToEnd) {
        // Keep the segment from start to intersection
        newShape.points = [{ ...start }, { ...closestIntersection }];
      } else {
        // Keep the segment from intersection to end
        newShape.points = [{ ...closestIntersection }, { ...end }];
      }

      return newShape;

    // Add support for other shape types as needed
    default:
      return shape;
  }
}

// Extend a shape to meet another shape
export function extendShape(
  shape: Shape,
  boundaryShapes: Shape[],
  clickPoint: Point
): Shape | null {
  // Handle different shape types
  switch (shape.type) {
    case 'line':
      if (shape.points.length < 2) return shape;

      const start = shape.points[0];
      const end = shape.points[1];

      // Determine which end to extend based on click point
      const distanceToStart = calculateDistance(clickPoint, start);
      const distanceToEnd = calculateDistance(clickPoint, end);

      const extendStart = distanceToStart < distanceToEnd;
      const fixedPoint = extendStart ? end : start;
      const pointToExtend = extendStart ? start : end;

      // Calculate line direction
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      // Extend the line in both directions to find intersections
      const extendedLine: Shape = {
        ...shape,
        points: [
          {
            x: start.x - dx * 1000,
            y: start.y - dy * 1000,
          },
          {
            x: end.x + dx * 1000,
            y: end.y + dy * 1000,
          },
        ],
      };

      // Find all intersections with boundary shapes
      let closestIntersection: Point | null = null;
      let minDistance = Number.MAX_VALUE;

      for (const boundaryShape of boundaryShapes) {
        const intersections = intersectShapes(extendedLine, boundaryShape);

        for (const intersection of intersections) {
          // Check if the intersection is in the right direction
          const vectorToIntersection = {
            x: intersection.x - pointToExtend.x,
            y: intersection.y - pointToExtend.y,
          };

          const vectorToEnd = {
            x: end.x - start.x,
            y: end.y - start.y,
          };

          // Check if the vectors point in the same direction when extending the end
          // or in opposite directions when extending the start
          const dotProduct =
            vectorToIntersection.x * vectorToEnd.x +
            vectorToIntersection.y * vectorToEnd.y;
          const isCorrectDirection = extendStart
            ? dotProduct < 0
            : dotProduct > 0;

          if (isCorrectDirection) {
            const distance = calculateDistance(pointToExtend, intersection);
            if (distance < minDistance) {
              minDistance = distance;
              closestIntersection = intersection;
            }
          }
        }
      }

      if (closestIntersection) {
        const newShape = cloneShape(shape);
        if (extendStart) {
          newShape.points = [closestIntersection, { ...fixedPoint }];
        } else {
          newShape.points = [{ ...fixedPoint }, closestIntersection];
        }
        return newShape;
      }

      return shape;

    // Add support for other shape types as needed
    default:
      return shape;
  }
}

// Join two collinear lines or arcs
export function joinShapes(shape1: Shape, shape2: Shape): Shape | null {
  // Handle different shape types
  if (shape1.type === 'line' && shape2.type === 'line') {
    const line1Start = shape1.points[0];
    const line1End = shape1.points[1];
    const line2Start = shape2.points[0];
    const line2End = shape2.points[1];

    // Check if lines are collinear
    const angle1 = angleFromPoints(line1Start, line1End);
    const angle2 = angleFromPoints(line2Start, line2End);

    // Allow a small tolerance for angle differences
    const angleThreshold = 0.01;
    const isCollinear =
      Math.abs(angle1 - angle2) < angleThreshold ||
      Math.abs(angle1 - angle2 - Math.PI) < angleThreshold ||
      Math.abs(angle1 - angle2 - 2 * Math.PI) < angleThreshold;

    if (!isCollinear) return null;

    // Find the most distant points to create a new line
    const distances = [
      {
        points: [line1Start, line2Start],
        distance: calculateDistance(line1Start, line2Start),
      },
      {
        points: [line1Start, line2End],
        distance: calculateDistance(line1Start, line2End),
      },
      {
        points: [line1End, line2Start],
        distance: calculateDistance(line1End, line2Start),
      },
      {
        points: [line1End, line2End],
        distance: calculateDistance(line1End, line2End),
      },
    ];

    distances.sort((a, b) => b.distance - a.distance);
    const mostDistant = distances[0].points;

    // Create a new joined line
    const newShape = cloneShape(shape1);
    newShape.points = [{ ...mostDistant[0] }, { ...mostDistant[1] }];
    return newShape;
  }

  // Add support for other shape types as needed
  return null;
}

// Create a chamfer between two lines
export function chamferShapes(
  shape1: Shape,
  shape2: Shape,
  distance1: number,
  distance2: number
): Shape[] | null {
  if (shape1.type !== 'line' || shape2.type !== 'line') return null;

  const line1Start = shape1.points[0];
  const line1End = shape1.points[1];
  const line2Start = shape2.points[0];
  const line2End = shape2.points[1];

  // Find intersection of the lines
  const intersections = intersectShapes(shape1, shape2);
  if (intersections.length === 0) return null;

  const intersection = intersections[0];

  // Calculate unit vectors along each line
  const line1Vec = {
    x: (line1End.x - line1Start.x) / calculateDistance(line1Start, line1End),
    y: (line1End.y - line1Start.y) / calculateDistance(line1Start, line1End),
  };

  const line2Vec = {
    x: (line2End.x - line2Start.x) / calculateDistance(line2Start, line2End),
    y: (line2End.y - line2Start.y) / calculateDistance(line2Start, line2End),
  };

  // Calculate chamfer points
  const chamferPoint1 = {
    x: intersection.x + line1Vec.x * distance1,
    y: intersection.y + line1Vec.y * distance1,
  };

  const chamferPoint2 = {
    x: intersection.x + line2Vec.x * distance2,
    y: intersection.y + line2Vec.y * distance2,
  };

  // Create modified lines
  const newLine1 = cloneShape(shape1);
  const newLine2 = cloneShape(shape2);

  // Determine which end of each line is closer to the intersection
  const isLine1StartCloser =
    calculateDistance(line1Start, intersection) <
    calculateDistance(line1End, intersection);
  const isLine2StartCloser =
    calculateDistance(line2Start, intersection) <
    calculateDistance(line2End, intersection);

  if (isLine1StartCloser) {
    newLine1.points = [chamferPoint1, { ...line1End }];
  } else {
    newLine1.points = [{ ...line1Start }, chamferPoint1];
  }

  if (isLine2StartCloser) {
    newLine2.points = [chamferPoint2, { ...line2End }];
  } else {
    newLine2.points = [{ ...line2Start }, chamferPoint2];
  }

  // Create chamfer line
  const chamferLine: Shape = {
    id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: 'line',
    points: [{ ...chamferPoint1 }, { ...chamferPoint2 }],
    properties: {},
  };

  return [newLine1, newLine2, chamferLine];
}

// Create a fillet (rounded corner) between two lines
export function filletShapes(
  shape1: Shape,
  shape2: Shape,
  radius: number
): Shape[] | null {
  if (shape1.type !== 'line' || shape2.type !== 'line') return null;

  const line1Start = shape1.points[0];
  const line1End = shape1.points[1];
  const line2Start = shape2.points[0];
  const line2End = shape2.points[1];

  // Find intersection of the lines
  const intersections = intersectShapes(shape1, shape2);
  if (intersections.length === 0) return null;

  const intersection = intersections[0];

  // Calculate unit vectors along each line
  const line1Vec = {
    x: (line1End.x - line1Start.x) / calculateDistance(line1Start, line1End),
    y: (line1End.y - line1Start.y) / calculateDistance(line1Start, line1End),
  };

  const line2Vec = {
    x: (line2End.x - line2Start.x) / calculateDistance(line2Start, line2End),
    y: (line2End.y - line2Start.y) / calculateDistance(line2Start, line2End),
  };

  // Calculate the angle between the lines
  const dot = line1Vec.x * line2Vec.x + line1Vec.y * line2Vec.y;
  const angle = Math.acos(Math.min(Math.max(dot, -1), 1));

  // Calculate the tangent distance
  const tangentDistance = radius / Math.tan(angle / 2);

  // Calculate points where the fillet arc will touch the lines
  const tangentPoint1 = {
    x: intersection.x - line1Vec.x * tangentDistance,
    y: intersection.y - line1Vec.y * tangentDistance,
  };

  const tangentPoint2 = {
    x: intersection.x - line2Vec.x * tangentDistance,
    y: intersection.y - line2Vec.y * tangentDistance,
  };

  // Calculate the fillet arc center
  const bisectorAngle =
    (angleFromPoints({ x: 0, y: 0 }, line1Vec) +
      angleFromPoints({ x: 0, y: 0 }, line2Vec)) /
    2;
  const centerDistance = radius / Math.sin(angle / 2);

  const arcCenter = {
    x: intersection.x - Math.cos(bisectorAngle) * centerDistance,
    y: intersection.y - Math.sin(bisectorAngle) * centerDistance,
  };

  // Create modified lines
  const newLine1 = cloneShape(shape1);
  const newLine2 = cloneShape(shape2);

  // Determine which end of each line is closer to the intersection
  const isLine1StartCloser =
    calculateDistance(line1Start, intersection) <
    calculateDistance(line1End, intersection);
  const isLine2StartCloser =
    calculateDistance(line2Start, intersection) <
    calculateDistance(line2End, intersection);

  if (isLine1StartCloser) {
    newLine1.points = [tangentPoint1, { ...line1End }];
  } else {
    newLine1.points = [{ ...line1Start }, tangentPoint1];
  }

  if (isLine2StartCloser) {
    newLine2.points = [tangentPoint2, { ...line2End }];
  } else {
    newLine2.points = [{ ...line2Start }, tangentPoint2];
  }

  // Calculate start and end angles for the arc
  const startAngle = angleFromPoints(arcCenter, tangentPoint1);
  const endAngle = angleFromPoints(arcCenter, tangentPoint2);

  // Create fillet arc
  const filletArc: Shape = {
    id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: 'arc',
    points: [{ ...arcCenter }, { ...tangentPoint1 }, { ...tangentPoint2 }],
    properties: {
      radius,
      startAngle,
      endAngle,
    },
  };

  return [newLine1, newLine2, filletArc];
}

// Execute a specific editing operation
export function executeEditingOperation(
  operation:
    | 'copy'
    | 'move'
    | 'rotate'
    | 'offset'
    | 'mirror'
    | 'stretch'
    | 'trim'
    | 'extend'
    | 'join'
    | 'chamfer'
    | 'fillet',
  shapes: Shape[],
  selectedIds: string[],
  parameters: any,
  basePoint?: Point,
  targetPoint?: Point,
  secondaryPoint?: Point
): Shape[] {
  const selectedShapes = shapes.filter((shape) =>
    selectedIds.includes(shape.id)
  );

  switch (operation) {
    case 'copy': {
      if (!basePoint || !targetPoint) return shapes;

      const dx = targetPoint.x - basePoint.x;
      const dy = targetPoint.y - basePoint.y;

      const newShapes: Shape[] = selectedShapes.map((shape) =>
        translateShape(shape, dx, dy)
      );
      return [...shapes, ...newShapes];
    }

    case 'move': {
      if (!basePoint || !targetPoint) return shapes;

      const dx = targetPoint.x - basePoint.x;
      const dy = targetPoint.y - basePoint.y;

      return shapes.map((shape) => {
        if (selectedIds.includes(shape.id)) {
          return translateShape(shape, dx, dy);
        }
        return shape;
      });
    }

    case 'rotate': {
      if (!basePoint || !parameters.angle) return shapes;

      const angle = parameters.angle * (Math.PI / 180); // convert to radians

      return shapes.map((shape) => {
        if (selectedIds.includes(shape.id)) {
          return rotateShape(shape, basePoint, angle);
        }
        return shape;
      });
    }

    case 'offset': {
      if (!parameters.distance || selectedIds.length !== 1) return shapes;

      const shapeToOffset = shapes.find((shape) => shape.id === selectedIds[0]);
      if (!shapeToOffset || !targetPoint) return shapes;

      const side = parameters.side || 'left';
      const offsetedShape: Shape = offsetShape(
        shapeToOffset,
        parameters.distance,
        side
      );

      return [...shapes, offsetedShape];
    }

    case 'mirror': {
      if (!basePoint || !secondaryPoint) return shapes;

      const newShapes: Shape[] = [];

      selectedShapes.forEach((shape) => {
        const mirroredShape = mirrorShape(shape, basePoint, secondaryPoint);
        newShapes.push(mirroredShape);
      });

      return [...shapes, ...newShapes];
    }

    case 'stretch': {
      if (!basePoint || !targetPoint || !parameters.selectionArea)
        return shapes;

      return shapes.map((shape) => {
        if (selectedIds.includes(shape.id)) {
          return stretchShape(
            shape,
            parameters.selectionArea,
            basePoint,
            targetPoint
          );
        }
        return shape;
      });
    }

    case 'trim': {
      if (!targetPoint || selectedIds.length < 1) return shapes;

      // Get the shape to trim
      const shapeToTrim = shapes.find((shape) => shape.id === selectedIds[0]);
      if (!shapeToTrim) return shapes;

      // Get cutting shapes (all other selected shapes)
      const cuttingShapes = shapes.filter(
        (shape) => selectedIds.includes(shape.id) && shape.id !== shapeToTrim.id
      );

      // If there are no cutting shapes, try using all other shapes
      const effectiveCuttingShapes =
        cuttingShapes.length > 0
          ? cuttingShapes
          : shapes.filter((shape) => shape.id !== shapeToTrim.id);

      const trimmedShape = trimShape(
        shapeToTrim,
        effectiveCuttingShapes,
        targetPoint
      );
      if (!trimmedShape) return shapes;

      return shapes.map((shape) => {
        if (shape.id === shapeToTrim.id) {
          return trimmedShape;
        }
        return shape;
      });
    }

    case 'extend': {
      if (!targetPoint || selectedIds.length < 1) return shapes;

      // Get the shape to extend
      const shapeToExtend = shapes.find((shape) => shape.id === selectedIds[0]);
      if (!shapeToExtend) return shapes;

      // Get boundary shapes (all other shapes)
      const boundaryShapes = shapes.filter(
        (shape) => shape.id !== shapeToExtend.id
      );
      if (boundaryShapes.length === 0) return shapes;

      const extendedShape = extendShape(
        shapeToExtend,
        boundaryShapes,
        targetPoint
      );
      if (!extendedShape) return shapes;

      return shapes.map((shape) => {
        if (shape.id === shapeToExtend.id) {
          return extendedShape;
        }
        return shape;
      });
    }

    case 'join': {
      if (selectedIds.length !== 2) return shapes;

      const shape1 = shapes.find((shape) => shape.id === selectedIds[0]);
      const shape2 = shapes.find((shape) => shape.id === selectedIds[1]);

      if (!shape1 || !shape2) return shapes;

      const joinedShape = joinShapes(shape1, shape2);
      if (!joinedShape) return shapes;

      // Remove the original shapes and add the joined shape
      return [
        ...shapes.filter((shape) => !selectedIds.includes(shape.id)),
        joinedShape,
      ];
    }

    case 'chamfer': {
      if (
        selectedIds.length !== 2 ||
        !parameters.distance1 ||
        !parameters.distance2
      )
        return shapes;

      const shape1 = shapes.find((shape) => shape.id === selectedIds[0]);
      const shape2 = shapes.find((shape) => shape.id === selectedIds[1]);

      if (!shape1 || !shape2) return shapes;

      const chamferResult = chamferShapes(
        shape1,
        shape2,
        parameters.distance1,
        parameters.distance2
      );
      if (!chamferResult) return shapes;

      // Remove the original shapes and add the modified shapes and the chamfer
      return [
        ...shapes.filter((shape) => !selectedIds.includes(shape.id)),
        ...chamferResult,
      ];
    }

    case 'fillet': {
      if (selectedIds.length !== 2 || !parameters.radius) return shapes;

      const shape1 = shapes.find((shape) => shape.id === selectedIds[0]);
      const shape2 = shapes.find((shape) => shape.id === selectedIds[1]);

      if (!shape1 || !shape2) return shapes;

      const filletResult = filletShapes(shape1, shape2, parameters.radius);
      if (!filletResult) return shapes;

      // Remove the original shapes and add the modified shapes and the fillet arc
      return [
        ...shapes.filter((shape) => !selectedIds.includes(shape.id)),
        ...filletResult,
      ];
    }

    default:
      return shapes;
  }
}

// Array shapes along a path
export function arrayAlongPath(
  shapes: Shape[],
  selectedIds: string[],
  pathShape: Shape,
  count: number
): Shape[] {
  const selectedShapes = shapes.filter((shape) =>
    selectedIds.includes(shape.id)
  );
  if (selectedShapes.length === 0 || !pathShape) return shapes;

  const newShapes: Shape[] = [];

  // Calculate path length
  let pathLength = 0;
  let pathPoints: Point[] = [];

  if (pathShape.type === 'line') {
    // For a line, just use the start and end points
    pathPoints = [...pathShape.points];
    pathLength = calculateDistance(pathPoints[0], pathPoints[1]);
  } else if (pathShape.type === 'arc') {
    // For an arc, calculate points along the arc
    const center = pathShape.points[0];
    const radius =
      pathShape.properties?.radius ||
      calculateDistance(center, pathShape.points[1]);
    const startAngle = pathShape.properties?.startAngle || 0;
    const endAngle = pathShape.properties?.endAngle || Math.PI * 2;

    // Calculate arc length
    const arcAngle = endAngle - startAngle;
    pathLength = Math.abs(arcAngle * radius);

    // Generate points along the arc
    const steps = Math.max(20, count * 2); // Use more points for smoother interpolation
    pathPoints = Array.from({ length: steps + 1 }, (_, i) => {
      const angle = startAngle + (arcAngle * i) / steps;
      return {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
    });
  } else if (pathShape.type === 'polyline') {
    // For a polyline, calculate the length of each segment
    pathPoints = [...pathShape.points];
    for (let i = 1; i < pathPoints.length; i++) {
      pathLength += calculateDistance(pathPoints[i - 1], pathPoints[i]);
    }
  }

  if (pathPoints.length < 2) return shapes;

  // Calculate spacing between copies
  const spacing = pathLength / (count - 1);

  // Place shapes along the path
  for (let i = 0; i < count; i++) {
    const position = i * spacing;
    let currentPos = 0;
    let segmentStart = pathPoints[0];
    let segmentEnd = pathPoints[0];
    let segmentLength = 0;
    let positionOnPath: Point | null = null;
    let tangentAngle = 0;

    // Find the segment where the current position falls
    for (let j = 1; j < pathPoints.length; j++) {
      segmentStart = pathPoints[j - 1];
      segmentEnd = pathPoints[j];
      segmentLength = calculateDistance(segmentStart, segmentEnd);

      if (
        currentPos + segmentLength >= position ||
        j === pathPoints.length - 1
      ) {
        // Found the segment, calculate the exact position
        const t =
          segmentLength === 0 ? 0 : (position - currentPos) / segmentLength;
        positionOnPath = {
          x: segmentStart.x + (segmentEnd.x - segmentStart.x) * t,
          y: segmentStart.y + (segmentEnd.y - segmentStart.y) * t,
        };

        // Calculate tangent angle at this point
        tangentAngle = angleFromPoints(segmentStart, segmentEnd);
        break;
      }

      currentPos += segmentLength;
    }

    if (positionOnPath) {
      selectedShapes.forEach((shape) => {
        // First translate to the position on the path
        let newShape = translateShape(
          shape,
          positionOnPath!.x - selectedShapes[0].points[0].x,
          positionOnPath!.y - selectedShapes[0].points[0].y
        );

        // Then rotate to align with the path tangent
        const centerPoint = {
          x: positionOnPath!.x,
          y: positionOnPath!.y,
        };

        newShape = rotateShape(newShape, centerPoint, tangentAngle);
        newShapes.push(newShape);
      });
    }
  }

  return [...shapes, ...newShapes];
}
