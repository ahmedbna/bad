import { Point } from '@/types';
import { worldToCanvas } from '@/utils/worldToCanvas';
import { SnapMode, SnapResult } from '@/components/snap/useSnapping';

/**
 * Renders a visual indicator for the active snap point
 */
export const renderSnapIndicator = (
  ctx: CanvasRenderingContext2D,
  snapResult: SnapResult,
  scale: number,
  offset: Point
) => {
  if (!snapResult) return;

  const { point, snapMode } = snapResult;

  // Convert world coordinates to canvas coordinates
  const canvasPoint = worldToCanvas({ point, offset, scale });

  // Save current context state
  ctx.save();

  // Common styles
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#0ea5e9'; // Sky blue color
  ctx.fillStyle = 'rgba(14, 165, 233, 0.2)'; // Semitransparent sky blue

  // Draw different indicators based on snap mode
  switch (snapMode) {
    case SnapMode.ENDPOINT:
      drawEndpointIndicator(ctx, canvasPoint);
      break;
    case SnapMode.MIDPOINT:
      drawMidpointIndicator(ctx, canvasPoint);
      break;
    case SnapMode.CENTER:
      drawCenterIndicator(ctx, canvasPoint);
      break;
    case SnapMode.NODE:
      drawNodeIndicator(ctx, canvasPoint);
      break;
    case SnapMode.QUADRANT:
      drawQuadrantIndicator(ctx, canvasPoint, snapResult.snapInfo?.quadrant);
      break;
    case SnapMode.INTERSECTION:
      drawIntersectionIndicator(ctx, canvasPoint);
      break;
    case SnapMode.GRID:
      drawGridIndicator(ctx, canvasPoint);
      break;
    default:
      drawDefaultIndicator(ctx, canvasPoint);
  }

  // Draw snap mode text label
  drawSnapLabel(ctx, canvasPoint, snapMode);

  // Restore context
  ctx.restore();
};

// Draw endpoint snap indicator (square)
const drawEndpointIndicator = (ctx: CanvasRenderingContext2D, point: Point) => {
  const size = 10;
  ctx.beginPath();
  ctx.rect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.fill();
  ctx.stroke();
};

// Draw midpoint snap indicator (diamond)
const drawMidpointIndicator = (ctx: CanvasRenderingContext2D, point: Point) => {
  const size = 8;
  ctx.beginPath();
  ctx.moveTo(point.x, point.y - size);
  ctx.lineTo(point.x + size, point.y);
  ctx.lineTo(point.x, point.y + size);
  ctx.lineTo(point.x - size, point.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// Draw center snap indicator (circle with cross)
const drawCenterIndicator = (ctx: CanvasRenderingContext2D, point: Point) => {
  const radius = 8;
  // Draw circle
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw cross inside
  const crossSize = 6;
  ctx.beginPath();
  ctx.moveTo(point.x - crossSize, point.y);
  ctx.lineTo(point.x + crossSize, point.y);
  ctx.moveTo(point.x, point.y - crossSize);
  ctx.lineTo(point.x, point.y + crossSize);
  ctx.stroke();
};

// Draw node snap indicator (small circle)
const drawNodeIndicator = (ctx: CanvasRenderingContext2D, point: Point) => {
  const radius = 6;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
};

// Draw quadrant snap indicator (quarter circle)
const drawQuadrantIndicator = (
  ctx: CanvasRenderingContext2D,
  point: Point,
  quadrant?: 'n' | 's' | 'e' | 'w'
) => {
  const radius = 8;
  ctx.beginPath();

  // Draw a quarter circle based on the quadrant
  if (quadrant === 'n') {
    ctx.arc(point.x, point.y, radius, -Math.PI / 2, 0);
  } else if (quadrant === 's') {
    ctx.arc(point.x, point.y, radius, Math.PI / 2, Math.PI);
  } else if (quadrant === 'e') {
    ctx.arc(point.x, point.y, radius, 0, Math.PI / 2);
  } else if (quadrant === 'w') {
    ctx.arc(point.x, point.y, radius, Math.PI, -Math.PI / 2);
  } else {
    // Default if quadrant is not specified
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  }

  // Draw lines to center
  ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// Draw intersection snap indicator (X)
const drawIntersectionIndicator = (
  ctx: CanvasRenderingContext2D,
  point: Point
) => {
  const size = 8;

  ctx.beginPath();
  ctx.moveTo(point.x - size, point.y - size);
  ctx.lineTo(point.x + size, point.y + size);
  ctx.moveTo(point.x + size, point.y - size);
  ctx.lineTo(point.x - size, point.y + size);
  ctx.stroke();

  // Add a small circle at the center
  ctx.beginPath();
  ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
  ctx.fill();
};

// Draw grid snap indicator (plus)
const drawGridIndicator = (ctx: CanvasRenderingContext2D, point: Point) => {
  const size = 10;

  ctx.beginPath();
  ctx.moveTo(point.x - size, point.y);
  ctx.lineTo(point.x + size, point.y);
  ctx.moveTo(point.x, point.y - size);
  ctx.lineTo(point.x, point.y + size);
  ctx.stroke();

  // Add a small circle at the center
  ctx.beginPath();
  ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
  ctx.fill();
};

// Draw default indicator for other snap modes
const drawDefaultIndicator = (ctx: CanvasRenderingContext2D, point: Point) => {
  const radius = 5;

  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
};

// Draw text label indicating snap mode
const drawSnapLabel = (
  ctx: CanvasRenderingContext2D,
  point: Point,
  snapMode: SnapMode
) => {
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#0ea5e9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Convert enum value to readable text
  const snapModeText =
    snapMode.charAt(0).toUpperCase() + snapMode.slice(1).toLowerCase();

  // Draw text with slight offset
  ctx.fillText(snapModeText, point.x, point.y + 12);
};
