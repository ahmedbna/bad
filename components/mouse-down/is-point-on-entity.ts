import { Point, ViewState } from '@/hooks/CADContext';

type isPointOnEntityProps = {
  point: Point;
  entity: any;
  viewState: ViewState;
};

export const isPointOnEntity = ({
  point,
  entity,
  viewState,
}: isPointOnEntityProps): boolean => {
  const tolerance = 5 / viewState.zoom; // 5px in world coordinates

  switch (entity.type) {
    case 'line': {
      return isPointOnLine(point, entity.start, entity.end, tolerance);
    }
    case 'circle': {
      const distance = Math.sqrt(
        Math.pow(point.x - entity.center.x, 2) +
          Math.pow(point.y - entity.center.y, 2)
      );
      return Math.abs(distance - entity.radius) <= tolerance;
    }
    case 'rectangle': {
      return (
        point.x >= entity.topLeft.x - tolerance &&
        point.x <= entity.topLeft.x + entity.width + tolerance &&
        point.y >= entity.topLeft.y - tolerance &&
        point.y <= entity.topLeft.y + entity.height + tolerance &&
        // Check if point is close to any edge
        (Math.abs(point.x - entity.topLeft.x) <= tolerance ||
          Math.abs(point.x - (entity.topLeft.x + entity.width)) <= tolerance ||
          Math.abs(point.y - entity.topLeft.y) <= tolerance ||
          Math.abs(point.y - (entity.topLeft.y + entity.height)) <= tolerance)
      );
    }
    case 'polyline': {
      if (!entity.points || entity.points.length < 2) return false;

      for (let i = 0; i < entity.points.length - 1; i++) {
        if (
          isPointOnLine(
            point,
            entity.points[i],
            entity.points[i + 1],
            tolerance
          )
        ) {
          return true;
        }
      }
      return false;
    }
    case 'text': {
      // Simple box check for text
      const textWidth = entity.content.length * entity.fontSize * 0.6; // Approximation
      const textHeight = entity.fontSize;

      return (
        point.x >= entity.position.x &&
        point.x <= entity.position.x + textWidth &&
        point.y >= entity.position.y &&
        point.y <= entity.position.y + textHeight
      );
    }
    default:
      return false;
  }
};

const isPointOnLine = (
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  tolerance: number
): boolean => {
  const lineLength = Math.sqrt(
    Math.pow(lineEnd.x - lineStart.x, 2) + Math.pow(lineEnd.y - lineStart.y, 2)
  );

  if (lineLength === 0) return false;

  // Distance from point to line
  const distance =
    Math.abs(
      (lineEnd.y - lineStart.y) * point.x -
        (lineEnd.x - lineStart.x) * point.y +
        lineEnd.x * lineStart.y -
        lineEnd.y * lineStart.x
    ) / lineLength;

  // Check if point is within line segment bounds
  const dotProduct =
    (point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
    (point.y - lineStart.y) * (lineEnd.y - lineStart.y);

  const squaredLineLength = lineLength * lineLength;

  return (
    distance <= tolerance && dotProduct >= 0 && dotProduct <= squaredLineLength
  );
};
