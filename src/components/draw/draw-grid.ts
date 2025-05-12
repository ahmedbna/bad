import { Point } from '@/types';

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  ctx: CanvasRenderingContext2D;
  gridSize: number;
  scale: number;
  offset: Point;
  dpr: number; // Device pixel ratio
  theme?: string;
};

// Draw AutoCAD-like grid
export const drawGrid = ({
  canvasRef,
  ctx,
  scale,
  offset,
  gridSize,
  dpr,
  theme = 'dark',
}: Props) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  // Clear the canvas
  ctx.save();

  // Translate to the origin based on offset
  // This is crucial for proper grid alignment with world coordinates
  const offsetX = Math.round(offset.x);
  const offsetY = Math.round(offset.y);

  // Calculate the scaled grid size
  const scaledGridSize = gridSize * scale;

  // Calculate the world origin position (0,0 in world coordinates)
  // For initial render, position at bottom left by default
  const originX = offsetX;
  const originY = offsetY;

  // Get visible grid boundaries
  const leftGridLine = Math.floor(-offsetX / scaledGridSize) - 1;
  const rightGridLine =
    Math.ceil((canvas.width - offsetX) / scaledGridSize) + 1;
  const topGridLine = Math.floor(-offsetY / scaledGridSize) - 1;
  const bottomGridLine =
    Math.ceil((canvas.height - offsetY) / scaledGridSize) + 1;

  // Draw minor grid lines
  ctx.strokeStyle = theme === 'dark' ? '#e6e6e6' : '#1e1e1e';
  ctx.lineWidth = 0.05;

  // Draw vertical minor grid lines
  for (let i = leftGridLine; i <= rightGridLine; i++) {
    // Skip if this is a major grid line
    if (i % gridSize === 0) continue;

    const x = originX + i * scaledGridSize;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw horizontal minor grid lines
  for (let i = topGridLine; i <= bottomGridLine; i++) {
    // Skip if this is a major grid line
    if (i % gridSize === 0) continue;

    const y = originY + i * scaledGridSize;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw major grid lines
  ctx.strokeStyle = theme === 'dark' ? '#c0c0c0' : '#444';
  ctx.lineWidth = 0.1;

  // Draw vertical major grid lines
  for (
    let i = Math.floor(leftGridLine / gridSize) * gridSize;
    i <= Math.ceil(rightGridLine / gridSize) * gridSize;
    i += gridSize
  ) {
    const x = originX + i * scaledGridSize;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    // Add coordinate label for major vertical lines
    if (scale > 0.4 && i !== 0) {
      // Only show for reasonable zoom levels
      ctx.font = '9px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText(i.toString(), x, originY + 15);
    }
  }

  // Draw horizontal major grid lines
  for (
    let i = Math.floor(topGridLine / gridSize) * gridSize;
    i <= Math.ceil(bottomGridLine / gridSize) * gridSize;
    i += gridSize
  ) {
    const y = originY + i * scaledGridSize;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    // Add coordinate label for major horizontal lines
    if (scale > 0.4 && i !== 0) {
      // Only show for reasonable zoom levels
      ctx.font = '9px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'right';
      ctx.fillText((-i).toString(), originX - 5, y + 4);
    }
  }

  // Draw axes (stronger lines)
  ctx.strokeStyle = '#666'; // Darker for axes
  ctx.lineWidth = 0.5;

  // X-axis (horizontal line at Y=0)
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(canvas.width, originY);
  ctx.stroke();

  // Y-axis (vertical line at X=0)
  ctx.beginPath();
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, canvas.height);
  ctx.stroke();

  // Origin indicator with AutoCAD-style cross and dot
  const originSize = 36; // Size of the cross
  const cornerSize = 36; // Size of the L-shaped corner indicator

  const viewWidth = canvas.width / dpr;
  const viewHeight = canvas.height / dpr;

  if (
    originX >= 0 &&
    originX <= viewWidth &&
    originY >= 0 &&
    originY <= viewHeight
  ) {
    // Origin is visible on screen - draw crosshair with dot
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ff3838';

    // Horizontal line of cross
    ctx.beginPath();
    ctx.moveTo(originX - originSize, originY);
    ctx.lineTo(originX + originSize, originY);
    ctx.stroke();

    // Vertical line of cross
    ctx.beginPath();
    ctx.moveTo(originX, originY - originSize);
    ctx.lineTo(originX, originY + originSize);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(originX, originY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff3838';
    ctx.fill();
  } else {
    // Origin is off-screen - draw L-shaped indicators at corners
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ff3838';

    // Determine which corner(s) to show the L-shape indicator
    const corners = [];

    // Top-left corner
    if (originX < 0 && originY < 0) {
      corners.push({ x: 0, y: 0, dirX: 1, dirY: 1 });
    }
    // Top-right corner
    if (originX > viewWidth && originY < 0) {
      corners.push({ x: viewWidth, y: 0, dirX: -1, dirY: 1 });
    }
    // Bottom-left corner
    if (originX < 0 && originY > viewHeight) {
      corners.push({ x: 0, y: viewHeight, dirX: 1, dirY: -1 });
    }
    // Bottom-right corner
    if (originX > viewWidth && originY > viewHeight) {
      corners.push({ x: viewWidth, y: viewHeight, dirX: -1, dirY: -1 });
    }

    // Special cases for when origin is off on only one axis
    // Origin is off to the left
    if (originX < 0 && originY >= 0 && originY <= viewHeight) {
      corners.push({ x: 0, y: originY, dirX: 1, dirY: 0 });
    }
    // Origin is off to the right
    if (originX > viewWidth && originY >= 0 && originY <= viewHeight) {
      corners.push({ x: viewWidth, y: originY, dirX: -1, dirY: 0 });
    }
    // Origin is off to the top
    if (originY < 0 && originX >= 0 && originX <= viewWidth) {
      corners.push({ x: originX, y: 0, dirX: 0, dirY: 1 });
    }
    // Origin is off to the bottom
    if (originY > viewHeight && originX >= 0 && originX <= viewWidth) {
      corners.push({ x: originX, y: viewHeight, dirX: 0, dirY: -1 });
    }

    // Draw all corner indicators
    corners.forEach((corner) => {
      // Draw L-shape at corner
      ctx.beginPath();

      // First line of the L
      ctx.moveTo(corner.x, corner.y);
      ctx.lineTo(corner.x + cornerSize * corner.dirX, corner.y);

      // Second line of the L
      ctx.moveTo(corner.x, corner.y);
      ctx.lineTo(corner.x, corner.y + cornerSize * corner.dirY);

      ctx.stroke();

      // Draw small diagonal line pointing toward origin for better clarity
      ctx.beginPath();
      ctx.moveTo(corner.x, corner.y);
      ctx.lineTo(
        corner.x + cornerSize * 0.7 * corner.dirX,
        corner.y + cornerSize * 0.7 * corner.dirY
      );
      ctx.stroke();
    });
  }

  ctx.restore();
};
