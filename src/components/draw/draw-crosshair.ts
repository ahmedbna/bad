import { Point } from '@/types/point';

type Props = {
  ctx: CanvasRenderingContext2D;
  mousePos: Point;
  canvas: HTMLCanvasElement;
  gridSize: number;
  scale: number;
  offset: Point;
};

// Optional helper function to enable the crosshair cursor display
export const drawCrosshair = ({
  ctx,
  mousePos,
  canvas,
  gridSize,
  scale,
  offset,
}: Props) => {
  // Convert mouse position to grid coordinates
  const gridX = Math.round((mousePos.x - offset.x) / (gridSize * scale));
  const gridY = Math.round((mousePos.y - offset.y) / (gridSize * scale));

  // Draw crosshair lines
  ctx.save();
  ctx.strokeStyle = '#2196f3';
  ctx.lineWidth = 0.5;

  // Vertical line
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(mousePos.x, 0);
  ctx.lineTo(mousePos.x, canvas.height);
  ctx.stroke();

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(0, mousePos.y);
  ctx.lineTo(canvas.width, mousePos.y);
  ctx.stroke();

  ctx.setLineDash([]);

  // Display coordinates
  ctx.font = '12px monospace';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.fillText(`X: ${gridX}, Y: ${-gridY}`, 10, canvas.height - 10);

  ctx.restore();
};
