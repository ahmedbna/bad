import { ViewState } from '@/hooks/CADContext';

type GridProps = {
  viewState: ViewState;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
};

export const drawGrid = ({ viewState, ctx, width, height }: GridProps) => {
  const { zoom, panOffset, grid } = viewState;

  // Calculate visible grid area
  const gridSize = grid.size * zoom;
  const startX = Math.floor(-panOffset.x / gridSize) * gridSize + panOffset.x;
  const startY = Math.floor(-panOffset.y / gridSize) * gridSize + panOffset.y;

  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 0.4;

  // Draw vertical lines
  for (let x = startX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = startY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw major grid lines
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  const majorGridSize = 100 * zoom;

  // Draw major vertical lines
  for (
    let x = startX - (startX % majorGridSize);
    x < width;
    x += majorGridSize
  ) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw major horizontal lines
  for (
    let y = startY - (startY % majorGridSize);
    y < height;
    y += majorGridSize
  ) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};
