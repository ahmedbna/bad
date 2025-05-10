import { Point, Shape } from '@/types';
import { calculateDistance } from '@/utils/calculations';

// Execute a specific editing operation
export function executeEditingOperation(
  operation: 'copy' | 'move' | 'rotate' | 'offset' | 'mirror',
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

    case 'mirror': {
      if (!basePoint || !secondaryPoint) return shapes;

      const newShapes: Shape[] = [];

      selectedShapes.forEach((shape) => {
        const mirroredShape = mirrorShape(shape, basePoint, secondaryPoint);
        newShapes.push(mirroredShape);
      });

      return [...shapes, ...newShapes];
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

    default:
      return shapes;
  }
}

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
