import { Point } from '@/hooks/CADContext';

type LineProps = {
  ctx: CanvasRenderingContext2D;
  entity: any;
  worldToScreen: (point: Point) => Point;
};

export const drawLine = ({ ctx, entity, worldToScreen }: LineProps) => {
  const startPoint = worldToScreen(entity.start);
  const endPoint = worldToScreen(entity.end);

  // Save current context state
  ctx.save();

  // Set line styling properties
  ctx.strokeStyle = entity.properties?.strokeColor || '#000000';
  ctx.lineWidth = entity.properties?.strokeWidth || 1;

  // Apply anti-aliasing techniques
  // ctx.lineCap = 'round';
  // ctx.lineJoin = 'round';

  // For thin lines (width 1px), slightly offset for better anti-aliasing
  if (entity.properties?.strokeWidth === 1) {
    const offset = 0.5;
    ctx.translate(offset, offset);
  }

  // Draw the line
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();

  // Restore context
  ctx.restore();
};
