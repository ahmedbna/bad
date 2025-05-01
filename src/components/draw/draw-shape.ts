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

        ctx.stroke();
      }
      break;

    default:
      break;
  }
};
