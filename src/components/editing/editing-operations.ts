import { Doc, Id } from '@/convex/_generated/dataModel';
import { Point } from '@/types';
import { calculateDistance } from '@/utils/calculations';

// Execute a specific editing operation
export function executeEditingOperation(
  operation: 'copy' | 'move' | 'rotate' | 'offset' | 'mirror',
  shapes: Array<Doc<'shapes'>>,
  selectedIds: Id<'shapes'>[],
  parameters: any,
  basePoint?: Point,
  targetPoint?: Point
): Array<any> {
  // Return original shapes if no selection or required points are missing
  if (!selectedIds.length) return shapes;

  const selectedShapes = shapes.filter((shape) =>
    selectedIds.includes(shape._id)
  );

  if (selectedShapes.length === 0) return shapes;

  switch (operation) {
    case 'copy': {
      if (!basePoint || !targetPoint) return shapes;

      const dx = targetPoint.x - basePoint.x;
      const dy = targetPoint.y - basePoint.y;

      // Create deep copies of the selected shapes (without _id to indicate they are new)
      const newShapes = selectedShapes.map((shape) =>
        translateShape(shape, dx, dy, true)
      );

      // Return both original and new shapes
      return [...shapes, ...newShapes];
    }

    case 'move': {
      if (!basePoint || !targetPoint) return shapes;

      const dx = targetPoint.x - basePoint.x;
      const dy = targetPoint.y - basePoint.y;

      // Move the selected shapes to the new position (updating existing shapes)
      return shapes.map((shape) => {
        if (selectedIds.includes(shape._id)) {
          return translateShape(shape, dx, dy, false); // Keep original ID for updates
        }
        return shape;
      });
    }

    case 'rotate': {
      if (!basePoint) return shapes;

      // Use provided angle or calculate from points
      let angle = parameters.angle || 0;
      if (targetPoint && !parameters.angle) {
        // Calculate angle from base point to target point
        const dx = targetPoint.x - basePoint.x;
        const dy = targetPoint.y - basePoint.y;
        angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }

      // Convert degrees to radians
      const radians = angle * (Math.PI / 180);

      // Rotate the selected shapes
      return shapes.map((shape) => {
        if (selectedIds.includes(shape._id)) {
          return rotateShape(shape, basePoint, radians, false); // Keep original ID for updates
        }
        return shape;
      });
    }

    case 'mirror': {
      if (!basePoint || !targetPoint) return shapes;

      // Create mirrored copies of the selected shapes (without _id to indicate they are new)
      const newShapes = selectedShapes.map((shape) =>
        mirrorShape(shape, basePoint, targetPoint)
      );

      // Return both original and new shapes
      return [...shapes, ...newShapes];
    }

    case 'offset': {
      if (!parameters.distance || selectedIds.length !== 1) return shapes;

      const shapeToOffset = shapes.find(
        (shape) => shape._id === selectedIds[0]
      );
      if (!shapeToOffset) return shapes;

      // Determine side based on parameters or target point relative to base point
      let side = parameters.side || 'right';
      if (targetPoint && basePoint) {
        // Calculate which side of the shape to offset to based on target point
        side = determineSide(shapeToOffset, basePoint, targetPoint);
      }

      // Create offset shape (without _id to indicate it's new)
      const offsetedShape = offsetShape(
        shapeToOffset,
        parameters.distance,
        side
      );

      // Return both original and new offset shape
      return [...shapes, offsetedShape];
    }

    default:
      return shapes;
  }
}

// Helper function to determine which side to offset to
function determineSide(
  shape: Doc<'shapes'>,
  basePoint: Point,
  targetPoint: Point
): 'left' | 'right' {
  // For line shapes, determine side based on which side of the line the target point is on
  if (shape.type === 'line' && shape.points.length >= 2) {
    const p1 = shape.points[0];
    const p2 = shape.points[1];

    // Calculate vector from p1 to p2
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Calculate normal vector (perpendicular to line)
    const nx = -dy;
    const ny = dx;

    // Calculate vector from p1 to target
    const tx = targetPoint.x - p1.x;
    const ty = targetPoint.y - p1.y;

    // Dot product to determine side
    const dotProduct = nx * tx + ny * ty;

    return dotProduct > 0 ? 'right' : 'left';
  }

  // For other shapes, use simple left/right determination
  return targetPoint.x > basePoint.x ? 'right' : 'left';
}

// Create a cloned shape without _id for new shapes
export function cloneShape(
  shape: Doc<'shapes'>,
  createNewId: boolean = true
): any {
  const clonedShape = {
    ...shape,
    points: [...shape.points.map((p) => ({ ...p }))],
    properties: { ...shape.properties },
  };

  // Remove _id to indicate this is a new shape to be created
  if (createNewId) {
    const { _id, ...rest } = clonedShape;
    return rest;
  }

  return clonedShape;
}

// Translate a shape by dx, dy
export function translateShape(
  shape: Doc<'shapes'>,
  dx: number,
  dy: number,
  createNewId: boolean = true
): any {
  const newShape = cloneShape(shape, createNewId);

  newShape.points = newShape.points.map((point: Point) => ({
    x: point.x + dx,
    y: point.y + dy,
  }));

  return newShape;
}

// Rotate a shape around a point
export function rotateShape(
  shape: Doc<'shapes'>,
  center: Point,
  angle: number,
  createNewId: boolean = true
): any {
  const newShape = cloneShape(shape, createNewId);

  newShape.points = newShape.points.map((point: Point) => {
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
export function mirrorShape(shape: Doc<'shapes'>, p1: Point, p2: Point): any {
  const newShape = cloneShape(shape, true); // Always create new ID for mirrored shapes

  // Calculate the line's direction vector
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Calculate the line's normal
  const lineLength = Math.sqrt(dx * dx + dy * dy);
  const nx = dy / lineLength;
  const ny = -dx / lineLength;

  newShape.points = newShape.points.map((point: Point) => {
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
  shape: Doc<'shapes'>,
  distance: number,
  side: 'left' | 'right' | 'inner' | 'outer'
): any {
  const newShape = cloneShape(shape, true); // Always create new ID for offset shapes

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
        side === 'outer' || side === 'right'
          ? radius + distance
          : Math.max(radius - distance, 0.1);

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

    case 'circle':
      // For circles, just need to modify the radius
      if (shape.points.length < 2) return shape;

      const circleCenter = shape.points[0];
      const circleRadius = calculateDistance(circleCenter, shape.points[1]);

      // Apply offset based on side
      const newCircleRadius =
        side === 'outer' || side === 'right'
          ? circleRadius + distance
          : Math.max(circleRadius - distance, 0.1);

      newShape.points = [
        { ...circleCenter },
        {
          x: circleCenter.x + newCircleRadius,
          y: circleCenter.y,
        },
      ];

      if (shape.properties) {
        newShape.properties = {
          ...newShape.properties,
          radius: newCircleRadius,
        };
      }

      return newShape;

    case 'polyline':
    case 'polygon':
      // For polylines and polygons, offset each segment
      // This is complex and would need a more robust implementation
      // Not fully implemented here
      return shape;

    default:
      return shape;
  }
}
