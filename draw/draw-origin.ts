import { ViewState } from '@/hooks/CADContext';

type OriginProps = {
  ctx: CanvasRenderingContext2D;
  viewState: ViewState;
};

export const drawOrigin = ({ ctx, viewState }: OriginProps) => {
  const { panOffset } = viewState;

  // Calculate origin position
  const originX = panOffset.x;
  const originY = panOffset.y;

  // Draw origin crosshair
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.lineWidth = 1;

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(originX - 10, originY);
  ctx.lineTo(originX + 10, originY);
  ctx.stroke();

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(originX, originY - 10);
  ctx.lineTo(originX, originY + 10);
  ctx.stroke();
};
