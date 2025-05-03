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

  // Add a fill color with transparency for temporary shapes to improve visual feedback
  if (isTemporary) {
    ctx.fillStyle = 'rgba(156, 163, 175, 0.1)';
  } else {
    ctx.fillStyle = isSelected ? 'rgba(37, 99, 235, 0.1)' : 'rgba(0, 0, 0, 0)';
  }

  switch (shape.type) {
    case 'line':
      if (shape.points.length >= 2) {
        const start = worldToCanvas({ point: shape.points[0], scale, offset });
        const end = worldToCanvas({ point: shape.points[1], scale, offset });

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          drawControlPoints(ctx, [start, end]);
        }
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
        ctx.fill();
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          const controlPoints = [
            start,
            { x: start.x + width, y: start.y },
            end,
            { x: start.x, y: start.y + height },
          ];
          drawControlPoints(ctx, controlPoints);
        }
      }
      break;

    case 'circle':
      if (shape.points.length >= 1 && shape.properties?.radius) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = shape.properties.radius * scale;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          // Draw center point
          drawControlPoint(ctx, center);

          // Draw radius control point
          const radiusPoint = {
            x: center.x + radius,
            y: center.y,
          };
          drawControlPoint(ctx, radiusPoint);

          // Draw a line connecting center to radius point
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(radiusPoint.x, radiusPoint.y);
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      break;

    case 'arc':
      if (shape.points.length >= 1) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = (shape.properties?.radius || 0) * scale;
        const startAngle = shape.properties?.startAngle || 0;
        const endAngle = shape.properties?.endAngle || Math.PI * 2;
        const isClockwise = shape.properties?.isClockwise || false;

        // If it's a temporary shape and has the isDashed property, use dashed lines
        // if (isTemporary && shape.properties?.isDashed) {
        //   ctx.setLineDash([5, 5]);
        // }

        ctx.beginPath();

        // In HTML5 Canvas, true = counterclockwise, false = clockwise
        // But in our internal logic, isClockwise has the opposite meaning
        // So we need to invert the flag here
        ctx.arc(center.x, center.y, radius, startAngle, endAngle, !isClockwise);

        ctx.stroke();

        // Reset dashed line setting
        // if (isTemporary && shape.properties?.isDashed) {
        //   ctx.setLineDash([]);
        // }

        // Draw control points when selected
        if (isSelected) {
          // Draw center point
          drawControlPoint(ctx, center);

          // Draw start and end points of the arc
          const startPoint = {
            x: center.x + radius * Math.cos(startAngle),
            y: center.y + radius * Math.sin(startAngle),
          };

          const endPoint = {
            x: center.x + radius * Math.cos(endAngle),
            y: center.y + radius * Math.sin(endAngle),
          };

          drawControlPoint(ctx, startPoint);
          drawControlPoint(ctx, endPoint);

          // Draw radial lines
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(startPoint.x, startPoint.y);
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw a small indicator showing the arc direction
          const midAngle = isClockwise
            ? (startAngle + endAngle) / 2 + Math.PI
            : (startAngle + endAngle) / 2;

          const midRadius = radius * 0.9;
          const arrowSize = 8;

          const arrowPoint = {
            x: center.x + midRadius * Math.cos(midAngle),
            y: center.y + midRadius * Math.sin(midAngle),
          };

          const tangentAngle = midAngle + Math.PI / 2;

          ctx.beginPath();
          ctx.moveTo(arrowPoint.x, arrowPoint.y);
          ctx.lineTo(
            arrowPoint.x + arrowSize * Math.cos(tangentAngle - Math.PI / 6),
            arrowPoint.y + arrowSize * Math.sin(tangentAngle - Math.PI / 6)
          );
          ctx.moveTo(arrowPoint.x, arrowPoint.y);
          ctx.lineTo(
            arrowPoint.x + arrowSize * Math.cos(tangentAngle + Math.PI / 6),
            arrowPoint.y + arrowSize * Math.sin(tangentAngle + Math.PI / 6)
          );
          ctx.stroke();
        }
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
        const rotation = shape.properties.rotation || 0;
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
        ctx.fill();
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          // Draw center point
          drawControlPoint(ctx, center);

          // Draw x-radius and y-radius control points
          const radiusXPoint = {
            x: center.x + radiusX * Math.cos(rotation),
            y: center.y + radiusX * Math.sin(rotation),
          };

          const radiusYPoint = {
            x: center.x + radiusY * Math.cos(rotation + Math.PI / 2),
            y: center.y + radiusY * Math.sin(rotation + Math.PI / 2),
          };

          drawControlPoint(ctx, radiusXPoint);
          drawControlPoint(ctx, radiusYPoint);

          // Draw axis lines
          ctx.beginPath();
          ctx.moveTo(
            center.x - radiusX * Math.cos(rotation),
            center.y - radiusX * Math.sin(rotation)
          );
          ctx.lineTo(
            center.x + radiusX * Math.cos(rotation),
            center.y + radiusX * Math.sin(rotation)
          );
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(
            center.x - radiusY * Math.cos(rotation + Math.PI / 2),
            center.y - radiusY * Math.sin(rotation + Math.PI / 2)
          );
          ctx.lineTo(
            center.x + radiusY * Math.cos(rotation + Math.PI / 2),
            center.y + radiusY * Math.sin(rotation + Math.PI / 2)
          );
          ctx.stroke();
          ctx.setLineDash([]);
        }
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
        ctx.fill();
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          // Draw center point
          drawControlPoint(ctx, center);

          // Draw all vertices
          drawControlPoints(ctx, points);

          // Draw a radius line
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(points[0].x, points[0].y);
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
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
          ctx.fill();
        }

        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          drawControlPoints(ctx, points);
        }
      }
      break;

    case 'spline':
      if (shape.points.length >= 2) {
        const points = shape.points.map((point) =>
          worldToCanvas({ point, scale, offset })
        );

        ctx.beginPath();
        drawSpline(ctx, points, shape.properties?.tension || 0.5);

        if (shape.properties?.isClosed) {
          // Connect back to start for closed splines
          const lastPoint = points[points.length - 1];
          const firstPoint = points[0];

          // Calculate control points for closing segment
          const tensionFactor = (shape.properties?.tension || 0.5) / 6;
          const secondLastPoint = points[points.length - 2];
          const secondPoint = points[1];

          const cp1x =
            lastPoint.x + (firstPoint.x - secondLastPoint.x) * tensionFactor;
          const cp1y =
            lastPoint.y + (firstPoint.y - secondLastPoint.y) * tensionFactor;
          const cp2x =
            firstPoint.x - (secondPoint.x - lastPoint.x) * tensionFactor;
          const cp2y =
            firstPoint.y - (secondPoint.y - lastPoint.y) * tensionFactor;

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, firstPoint.x, firstPoint.y);
          ctx.fill();
        }

        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          drawControlPoints(ctx, points);
        }
      }
      break;

    default:
      break;
  }
};

// Helper function to draw a control point
const drawControlPoint = (ctx: CanvasRenderingContext2D, point: Point) => {
  const size = 6;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.rect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.fill();
  ctx.stroke();
};

// Helper function to draw multiple control points
const drawControlPoints = (ctx: CanvasRenderingContext2D, points: Point[]) => {
  points.forEach((point) => drawControlPoint(ctx, point));
};
