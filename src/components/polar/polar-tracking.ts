// src/components/polar/polar-tracking.ts
import { Point } from '@/types';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { worldToCanvas } from '@/utils/worldToCanvas';

interface PolarSettings {
  enabled: boolean;
  angleIncrement: number;
  angles: number[];
  snapThreshold: number;
  trackingLines: boolean;
}

/**
 * Applies polar tracking to a point based on the start point and allowed angles
 * @param startPoint The reference start point
 * @param currentPoint The current mouse position
 * @param polarSettings Polar tracking settings
 * @param scale Current scale factor
 * @returns The adjusted point that conforms to polar tracking
 */
export const applyPolarTracking = (
  startPoint: Point,
  currentPoint: Point,
  polarSettings: PolarSettings,
  scale: number
): Point => {
  if (!polarSettings.enabled) {
    return currentPoint;
  }

  // Calculate angle between start and current point
  const dx = currentPoint.x - startPoint.x;
  const dy = currentPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // If the distance is too small, don't apply tracking
  if (distance < 5 / scale) {
    return currentPoint;
  }

  // Calculate current angle in degrees (0 to 360)
  let currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (currentAngle < 0) {
    currentAngle += 360;
  }

  // Find the closest angle in the allowed angles array
  let closestAngle = polarSettings.angles[0];
  let minDiff = 360;

  for (const angle of polarSettings.angles) {
    // Calculate the difference, considering the circular nature of angles
    let diff = Math.abs(currentAngle - angle);
    if (diff > 180) {
      diff = 360 - diff;
    }

    if (diff < minDiff) {
      minDiff = diff;
      closestAngle = angle;
    }
  }

  // Only apply tracking if within threshold
  const thresholdInDegrees =
    Math.atan2(polarSettings.snapThreshold, distance) * (180 / Math.PI);

  if (minDiff <= thresholdInDegrees) {
    // Convert angle back to radians
    const angleRad = closestAngle * (Math.PI / 180);

    // Calculate new point at the same distance but with adjusted angle
    return {
      x: startPoint.x + distance * Math.cos(angleRad),
      y: startPoint.y + distance * Math.sin(angleRad),
    };
  }

  // If not within threshold, return the original point
  return currentPoint;
};

/**
 * Draws polar tracking lines emanating from a point - only shows the nearest angle constraint line
 */
export const drawPolarTrackingLines = ({
  dpr,
  ctx,
  scale,
  offset,
  mousePosition,
  angles,
  originPoint,
}: {
  ctx: CanvasRenderingContext2D;
  scale: number;
  offset: Point;
  mousePosition: Point;
  angles: number[];
  dpr: number;
  originPoint: Point;
}) => {
  // Get canvas dimensions
  const canvas = ctx.canvas;
  const canvasWidth = canvas.width / dpr;
  const canvasHeight = canvas.height / dpr;
  const maxDistance = Math.max(canvasWidth, canvasHeight) * 2;

  // Convert the origin point and mouse position to canvas coordinates
  const canvasOrigin = worldToCanvas({ point: originPoint, offset, scale });
  const canvasMouse = worldToCanvas({ point: mousePosition, offset, scale });

  // Calculate current mouse angle in radians relative to the origin point
  const currentAngle = Math.atan2(
    canvasMouse.y - canvasOrigin.y,
    canvasMouse.x - canvasOrigin.x
  );

  // Convert current angle to degrees and normalize to 0-360
  let currentAngleDeg = (currentAngle * (180 / Math.PI)) % 360;
  if (currentAngleDeg < 0) currentAngleDeg += 360;

  // Find the nearest angle constraint
  let nearestAngle = angles[0];
  let minDifference = 360;

  angles.forEach((angle) => {
    // Normalize angle to 0-360
    let normalizedAngle = angle % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;

    // Calculate difference (considering the circular nature)
    let diff = Math.abs(normalizedAngle - currentAngleDeg);
    if (diff > 180) diff = 360 - diff;

    if (diff < minDifference) {
      minDifference = diff;
      nearestAngle = angle;
    }
  });

  // Save the original context state
  ctx.save();

  // Set line style for tracking lines
  ctx.lineWidth = 1 / scale;
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.7)';
  ctx.setLineDash([5 / scale, 5 / scale]);

  // Draw only the nearest angle line
  const angleRad = nearestAngle * (Math.PI / 180);

  // Calculate endpoints at max distance in both directions (forward and backward)
  const endPoint1 = {
    x: originPoint.x + maxDistance * Math.cos(angleRad),
    y: originPoint.y + maxDistance * Math.sin(angleRad),
  };

  const endPoint2 = {
    x: originPoint.x - maxDistance * Math.cos(angleRad),
    y: originPoint.y - maxDistance * Math.sin(angleRad),
  };

  // Convert endpoints to canvas coordinates
  const canvasEnd1 = worldToCanvas({ point: endPoint1, offset, scale });
  const canvasEnd2 = worldToCanvas({ point: endPoint2, offset, scale });

  // Draw the line going through the origin point in both directions
  ctx.beginPath();
  ctx.moveTo(canvasEnd2.x, canvasEnd2.y);
  ctx.lineTo(canvasEnd1.x, canvasEnd1.y);
  ctx.stroke();

  // Restore the context state
  ctx.restore();
};
