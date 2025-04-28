import { Point } from '@/hooks/CADContext';

export const drawPointHandle = (
  ctx: CanvasRenderingContext2D,
  point: Point
) => {
  ctx.fillStyle = '#1E90FF';
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
  ctx.stroke();
};
