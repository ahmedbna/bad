import { Point } from '@/hooks/CADContext';

type LineProps = {
  ctx: CanvasRenderingContext2D;
  entity: any;
  worldToScreen: (point: Point) => Point;
};

export const drawLine = ({ ctx, entity, worldToScreen }: LineProps) => {
  const startPoint = worldToScreen(entity.start);
  const endPoint = worldToScreen(entity.end);

  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();
};
