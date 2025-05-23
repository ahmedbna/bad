import { Point } from '@/types';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { ControlPoint } from './control-points';

export interface ControlPointEditingState {
  isEditing: boolean;
  shapeId: Id<'shapes'> | null;
  activeControlPoint: ControlPoint | null;
  startPosition: Point;
  originalShape: (Doc<'shapes'> & { layer: Doc<'layers'> }) | null;
}

export const createInitialControlPointEditingState =
  (): ControlPointEditingState => ({
    isEditing: false,
    shapeId: null,
    activeControlPoint: null,
    startPosition: { x: 0, y: 0 },
    originalShape: null,
  });

export const calculateNewShapeFromControlPoint = (
  shape: Doc<'shapes'> & { layer: Doc<'layers'> },
  controlPoint: ControlPoint,
  newPosition: Point,
  originalPosition: Point
): Partial<Doc<'shapes'>> => {
  const deltaX = newPosition.x - originalPosition.x;
  const deltaY = newPosition.y - originalPosition.y;

  switch (shape.type) {
    case 'line':
      if (controlPoint.id === 'start') {
        return {
          points: [newPosition, shape.points[1]],
        };
      } else if (controlPoint.id === 'end') {
        return {
          points: [shape.points[0], newPosition],
        };
      }
      break;

    case 'rectangle':
      const [topLeft, topRight, bottomRight, bottomLeft] = shape.points;

      switch (controlPoint.id) {
        case 'top-left':
          return {
            points: [
              newPosition,
              { x: topRight.x, y: newPosition.y },
              bottomRight,
              { x: newPosition.x, y: bottomLeft.y },
            ],
          };
        case 'top-right':
          return {
            points: [
              { x: topLeft.x, y: newPosition.y },
              newPosition,
              { x: newPosition.x, y: bottomRight.y },
              bottomLeft,
            ],
          };
        case 'bottom-right':
          return {
            points: [
              topLeft,
              { x: newPosition.x, y: topRight.y },
              newPosition,
              { x: bottomLeft.x, y: newPosition.y },
            ],
          };
        case 'bottom-left':
          return {
            points: [
              { x: newPosition.x, y: topLeft.y },
              topRight,
              { x: bottomRight.x, y: newPosition.y },
              newPosition,
            ],
          };
        case 'top-mid':
          return {
            points: [
              { x: topLeft.x, y: newPosition.y },
              { x: topRight.x, y: newPosition.y },
              bottomRight,
              bottomLeft,
            ],
          };
        case 'bottom-mid':
          return {
            points: [
              topLeft,
              topRight,
              { x: bottomRight.x, y: newPosition.y },
              { x: bottomLeft.x, y: newPosition.y },
            ],
          };
        case 'left-mid':
          return {
            points: [
              { x: newPosition.x, y: topLeft.y },
              topRight,
              bottomRight,
              { x: newPosition.x, y: bottomLeft.y },
            ],
          };
        case 'right-mid':
          return {
            points: [
              topLeft,
              { x: newPosition.x, y: topRight.y },
              { x: newPosition.x, y: bottomRight.y },
              bottomLeft,
            ],
          };
      }
      break;

    case 'circle':
      if (controlPoint.property === 'radius') {
        const center = shape.points[0];
        const newRadius = Math.sqrt(
          Math.pow(newPosition.x - center.x, 2) +
            Math.pow(newPosition.y - center.y, 2)
        );

        return {
          properties: {
            ...shape.properties,
            radius: Math.max(1, newRadius),
            diameter: Math.max(2, newRadius * 2),
          },
        };
      }
      break;

    case 'ellipse':
      const ellipseCenter = shape.points[0];
      if (controlPoint.property === 'radiusX') {
        const newRadiusX = Math.abs(newPosition.x - ellipseCenter.x);
        return {
          properties: {
            ...shape.properties,
            radiusX: Math.max(1, newRadiusX),
          },
        };
      } else if (controlPoint.property === 'radiusY') {
        const newRadiusY = Math.abs(newPosition.y - ellipseCenter.y);
        return {
          properties: {
            ...shape.properties,
            radiusY: Math.max(1, newRadiusY),
          },
        };
      }
      break;

    case 'arc':
      const arcCenter = shape.points[0];
      if (controlPoint.property === 'radius') {
        const newRadius = Math.sqrt(
          Math.pow(newPosition.x - arcCenter.x, 2) +
            Math.pow(newPosition.y - arcCenter.y, 2)
        );
        return {
          properties: {
            ...shape.properties,
            radius: Math.max(1, newRadius),
          },
        };
      } else if (controlPoint.property === 'startAngle') {
        const newAngle = Math.atan2(
          newPosition.y - arcCenter.y,
          newPosition.x - arcCenter.x
        );
        return {
          properties: {
            ...shape.properties,
            startAngle: newAngle,
          },
        };
      } else if (controlPoint.property === 'endAngle') {
        const newAngle = Math.atan2(
          newPosition.y - arcCenter.y,
          newPosition.x - arcCenter.x
        );
        return {
          properties: {
            ...shape.properties,
            endAngle: newAngle,
          },
        };
      }
      break;

    case 'polygon':
      if (controlPoint.property === 'radius') {
        const polygonCenter = shape.points[0];
        const newRadius = Math.sqrt(
          Math.pow(newPosition.x - polygonCenter.x, 2) +
            Math.pow(newPosition.y - polygonCenter.y, 2)
        );
        return {
          properties: {
            ...shape.properties,
            radius: Math.max(1, newRadius),
          },
        };
      }
      break;

    case 'polyline':
    case 'spline':
      if (controlPoint.property === 'vertex') {
        const vertexIndex = parseInt(controlPoint.id.split('-')[1]);
        if (!isNaN(vertexIndex) && vertexIndex < shape.points.length) {
          const newPoints = [...shape.points];
          newPoints[vertexIndex] = newPosition;
          return {
            points: newPoints,
          };
        }
      }
      break;
  }

  // Handle center movement for most shapes
  if (controlPoint.type === 'move' && controlPoint.id === 'center') {
    const newPoints = shape.points.map((point) => ({
      x: point.x + deltaX,
      y: point.y + deltaY,
    }));

    return {
      points: newPoints,
    };
  }

  return {};
};

export const isValidControlPointEdit = (
  shape: Doc<'shapes'> & { layer: Doc<'layers'> },
  controlPoint: ControlPoint,
  newPosition: Point
): boolean => {
  // Add validation logic here
  // For example, prevent negative dimensions

  switch (shape.type) {
    case 'circle':
      if (controlPoint.property === 'radius') {
        const center = shape.points[0];
        const newRadius = Math.sqrt(
          Math.pow(newPosition.x - center.x, 2) +
            Math.pow(newPosition.y - center.y, 2)
        );
        return newRadius > 0;
      }
      break;

    case 'ellipse':
      const ellipseCenter = shape.points[0];
      if (controlPoint.property === 'radiusX') {
        return Math.abs(newPosition.x - ellipseCenter.x) > 0;
      } else if (controlPoint.property === 'radiusY') {
        return Math.abs(newPosition.y - ellipseCenter.y) > 0;
      }
      break;

    case 'rectangle':
      // Ensure rectangle maintains minimum size
      if (
        controlPoint.id.includes('top') ||
        controlPoint.id.includes('bottom')
      ) {
        const otherY = controlPoint.id.includes('top')
          ? Math.max(...shape.points.map((p) => p.y))
          : Math.min(...shape.points.map((p) => p.y));
        return Math.abs(newPosition.y - otherY) > 1;
      }
      if (
        controlPoint.id.includes('left') ||
        controlPoint.id.includes('right')
      ) {
        const otherX = controlPoint.id.includes('left')
          ? Math.max(...shape.points.map((p) => p.x))
          : Math.min(...shape.points.map((p) => p.x));
        return Math.abs(newPosition.x - otherX) > 1;
      }
      break;
  }

  return true;
};
