import { Point } from '@/hooks/CADContext';

type PoylineProps = {
  ctx: CanvasRenderingContext2D;
  entity: any;
  worldToScreen: (point: Point) => Point;
};

export const drawPolyline = ({ ctx, entity, worldToScreen }: PoylineProps) => {
  if (!entity.points || entity.points.length < 2) return;

  const transformedPoints = entity.points.map(worldToScreen);

  ctx.beginPath();
  ctx.moveTo(transformedPoints[0].x, transformedPoints[0].y);

  for (let i = 1; i < transformedPoints.length; i++) {
    ctx.lineTo(transformedPoints[i].x, transformedPoints[i].y);
  }

  ctx.stroke();
};
