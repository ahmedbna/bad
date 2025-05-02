import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { worldToCanvas } from '@/utils/worldToCanvas';

type Props = {
  ctx: CanvasRenderingContext2D;
  scale: number;
  offset: Point;
  shape: Shape;
  isSelected: boolean;
  isTemporary: boolean;
};

// Helper function to create regular polygon points
const calculatePolygonPoints = (
  center: Point,
  radius: number,
  sides: number
): Point[] => {
  const points: Point[] = [];
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }

  return points;
};

// Helper function to draw a spline (using cardinal spline for simplicity)
const drawSpline = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  tension = 0.5
) => {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    // Just draw a line if only two points
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  // Draw a Cardinal spline through the points
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    // Calculate control points
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;

    // Draw cubic bezier curve
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
};

// Draw shape
export const drawShape = ({
  ctx,
  shape,
  isSelected,
  scale,
  offset,
  isTemporary = false,
}: Props) => {
  ctx.strokeStyle = isSelected ? '#2563eb' : isTemporary ? '#9ca3af' : '#000';
  ctx.lineWidth = isSelected ? 2 : 1;

  switch (shape.type) {
    case 'line':
      if (shape.points.length >= 2) {
        const start = worldToCanvas({ point: shape.points[0], scale, offset });
        const end = worldToCanvas({ point: shape.points[1], scale, offset });

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      break;

    case 'rectangle':
      if (shape.points.length >= 2) {
        const start = worldToCanvas({ point: shape.points[0], scale, offset });
        const end = worldToCanvas({ point: shape.points[1], scale, offset });

        const width = end.x - start.x;
        const height = end.y - start.y;

        ctx.beginPath();
        ctx.rect(start.x, start.y, width, height);
        ctx.stroke();
      }
      break;

    case 'circle':
      if (shape.points.length >= 1 && shape.properties?.radius) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = shape.properties.radius * scale;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;

    case 'arc':
      if (shape.points.length >= 1 && shape.properties?.radius) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = shape.properties.radius * scale;
        const startAngle = shape.properties.startAngle || 0;
        const endAngle = shape.properties.endAngle || Math.PI * 2;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startAngle, endAngle);
        ctx.stroke();
      }
      break;

    case 'ellipse':
      if (
        shape.points.length >= 1 &&
        shape.properties?.radiusX &&
        shape.properties?.radiusY
      ) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radiusX = shape.properties.radiusX * scale;
        const radiusY = shape.properties.radiusY * scale;
        const rotation = 0; // Could be added to properties if needed
        const startAngle = shape.properties.startAngle || 0;
        const endAngle = shape.properties.isFullEllipse
          ? Math.PI * 2
          : shape.properties.endAngle || Math.PI * 2;

        ctx.beginPath();
        ctx.ellipse(
          center.x,
          center.y,
          radiusX,
          radiusY,
          rotation,
          startAngle,
          endAngle
        );
        ctx.stroke();
      }
      break;

    case 'polygon':
      if (
        shape.points.length >= 1 &&
        shape.properties?.radius &&
        shape.properties?.sides
      ) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = shape.properties.radius * scale;
        const sides = shape.properties.sides;
        const points = calculatePolygonPoints(
          { x: center.x, y: center.y },
          radius,
          sides
        );

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.closePath();
        ctx.stroke();
      }
      break;

    case 'polyline':
      if (shape.points.length >= 2) {
        const points = shape.points.map((point) =>
          worldToCanvas({ point, scale, offset })
        );

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }

        if (shape.properties?.isClosed) {
          ctx.closePath();
        }

        ctx.stroke();
      }
      break;

    case 'spline':
      if (shape.points.length >= 2) {
        const points = shape.points.map((point) =>
          worldToCanvas({ point, scale, offset })
        );

        ctx.beginPath();
        drawSpline(ctx, points);
        ctx.stroke();
      }
      break;

    default:
      break;
  }
};
