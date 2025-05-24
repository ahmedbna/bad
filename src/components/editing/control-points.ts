import { Point } from '@/types';
import { Doc } from '@/convex/_generated/dataModel';
import { worldToCanvas } from '@/utils/worldToCanvas';

export interface ControlPoint {
  id: string;
  x: number;
  y: number;
  type:
    | 'endpoint'
    | 'midpoint'
    | 'center'
    | 'quadrant'
    | 'corner'
    | 'edge'
    | 'radius'
    | 'angle';
  cursor: string;
  property?: string;
  metadata?: {
    index?: number; // For polyline vertices
    edge?: 'horizontal' | 'vertical'; // For rectangle edges
    angle?: 'start' | 'end'; // For arc angles
  };
}

export interface ControlPointsResult {
  controlPoints: ControlPoint[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    centerX: number;
    centerY: number;
  };
}

export const getControlPoints = (
  shape: Doc<'shapes'> & { layer: Doc<'layers'> }
): ControlPointsResult => {
  const points = shape.points;
  if (!points || points.length === 0) {
    return {
      controlPoints: [],
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0 },
    };
  }

  const controlPoints: ControlPoint[] = [];

  // Calculate bounds
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const bounds = { minX, minY, maxX, maxY, centerX, centerY };

  switch (shape.type) {
    case 'line':
      controlPoints.push(
        {
          id: 'start',
          x: points[0].x,
          y: points[0].y,
          type: 'endpoint',
          cursor: 'crosshair',
          property: 'startPoint',
          metadata: { index: 0 },
        },
        {
          id: 'end',
          x: points[1].x,
          y: points[1].y,
          type: 'endpoint',
          cursor: 'crosshair',
          property: 'endPoint',
          metadata: { index: 1 },
        },
        {
          id: 'midpoint',
          x: centerX,
          y: centerY,
          type: 'midpoint',
          cursor: 'move',
          property: 'midpoint',
        }
      );
      break;

    case 'rectangle':
      // Corner points
      controlPoints.push(
        {
          id: 'top-left',
          x: minX,
          y: minY,
          type: 'corner',
          cursor: 'nw-resize',
          property: 'topLeft',
        },
        {
          id: 'top-right',
          x: maxX,
          y: minY,
          type: 'corner',
          cursor: 'ne-resize',
          property: 'topRight',
        },
        {
          id: 'bottom-left',
          x: minX,
          y: maxY,
          type: 'corner',
          cursor: 'sw-resize',
          property: 'bottomLeft',
        },
        {
          id: 'bottom-right',
          x: maxX,
          y: maxY,
          type: 'corner',
          cursor: 'se-resize',
          property: 'bottomRight',
        },
        // Edge midpoints
        {
          id: 'top-mid',
          x: centerX,
          y: minY,
          type: 'edge',
          cursor: 'n-resize',
          property: 'height',
          metadata: { edge: 'horizontal' },
        },
        {
          id: 'bottom-mid',
          x: centerX,
          y: maxY,
          type: 'edge',
          cursor: 's-resize',
          property: 'height',
          metadata: { edge: 'horizontal' },
        },
        {
          id: 'left-mid',
          x: minX,
          y: centerY,
          type: 'edge',
          cursor: 'w-resize',
          property: 'width',
          metadata: { edge: 'vertical' },
        },
        {
          id: 'right-mid',
          x: maxX,
          y: centerY,
          type: 'edge',
          cursor: 'e-resize',
          property: 'width',
          metadata: { edge: 'vertical' },
        },
        // Center point
        {
          id: 'center',
          x: centerX,
          y: centerY,
          type: 'center',
          cursor: 'move',
        }
      );
      break;

    case 'circle':
      const center = points[0];
      const radius = shape.properties?.radius || 50;

      controlPoints.push(
        {
          id: 'center',
          x: center.x,
          y: center.y,
          type: 'center',
          cursor: 'move',
        },
        // Quadrant points
        {
          id: 'quadrant-right',
          x: center.x + radius,
          y: center.y,
          type: 'quadrant',
          cursor: 'ew-resize',
          property: 'radius',
        },
        {
          id: 'quadrant-top',
          x: center.x,
          y: center.y - radius,
          type: 'quadrant',
          cursor: 'ns-resize',
          property: 'radius',
        },
        {
          id: 'quadrant-left',
          x: center.x - radius,
          y: center.y,
          type: 'quadrant',
          cursor: 'ew-resize',
          property: 'radius',
        },
        {
          id: 'quadrant-bottom',
          x: center.x,
          y: center.y + radius,
          type: 'quadrant',
          cursor: 'ns-resize',
          property: 'radius',
        }
      );
      break;

    case 'arc':
      const arcCenter = points[0];
      const arcRadius = shape.properties?.radius || 50;
      const startAngle = shape.properties?.startAngle || 0;
      const endAngle = shape.properties?.endAngle || Math.PI;

      controlPoints.push(
        {
          id: 'center',
          x: arcCenter.x,
          y: arcCenter.y,
          type: 'center',
          cursor: 'move',
        },
        {
          id: 'radius-point',
          x: arcCenter.x + arcRadius,
          y: arcCenter.y,
          type: 'radius',
          cursor: 'ew-resize',
          property: 'radius',
        },
        {
          id: 'start-angle',
          x: arcCenter.x + arcRadius * Math.cos(startAngle),
          y: arcCenter.y + arcRadius * Math.sin(startAngle),
          type: 'angle',
          cursor: 'crosshair',
          property: 'startAngle',
          metadata: { angle: 'start' },
        },
        {
          id: 'end-angle',
          x: arcCenter.x + arcRadius * Math.cos(endAngle),
          y: arcCenter.y + arcRadius * Math.sin(endAngle),
          type: 'angle',
          cursor: 'crosshair',
          property: 'endAngle',
          metadata: { angle: 'end' },
        }
      );
      break;

    case 'polyline':
    case 'spline':
      // Add center point
      controlPoints.push({
        id: 'center',
        x: centerX,
        y: centerY,
        type: 'center',
        cursor: 'move',
      });

      // Control points for each vertex
      points.forEach((point, index) => {
        controlPoints.push({
          id: `vertex-${index}`,
          x: point.x,
          y: point.y,
          type: 'endpoint',
          cursor: 'crosshair',
          property: 'vertex',
          metadata: { index },
        });
      });
      break;
  }

  return { controlPoints, bounds };
};

export const renderControlPoints = (
  ctx: CanvasRenderingContext2D,
  controlPoints: ControlPoint[],
  scale: number,
  offset: Point,
  activeControlPointId?: string
) => {
  const size = 7;

  controlPoints.forEach((point) => {
    const canvasPos = worldToCanvas({
      point: { x: point.x, y: point.y },
      scale,
      offset,
    });
    const screenX = canvasPos.x;
    const screenY = canvasPos.y;

    ctx.save();

    // Highlight active control point
    const isActive = activeControlPointId === point.id;

    ctx.strokeStyle = isActive ? '#ef4444' : '#3b82f6'; // Red when active
    ctx.fillStyle = isActive ? 'rgba(239, 68, 68, 0.2)' : 'transparent';

    ctx.lineWidth = isActive ? 2 : 1;

    ctx.beginPath();
    const drawSize = isActive ? size + 1 : size;

    ctx.rect(
      screenX - drawSize / 2,
      screenY - drawSize / 2,
      drawSize,
      drawSize
    );

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
};

// Updated getControlPointAtPosition function - fix coordinate comparison
export const getControlPointAtPosition = (
  controlPoints: ControlPoint[],
  mouseX: number, // Canvas coordinates
  mouseY: number, // Canvas coordinates
  scale: number,
  offset: Point,
  threshold: number = 12
): ControlPoint | null => {
  for (const point of controlPoints) {
    // Convert control point world coordinates to canvas coordinates
    const canvasPos = worldToCanvas({
      point: { x: point.x, y: point.y },
      scale,
      offset,
    });
    const canvasX = canvasPos.x;
    const canvasY = canvasPos.y;

    // Calculate distance between mouse position and control point canvas position
    const distance = Math.sqrt(
      Math.pow(mouseX - canvasX, 2) + Math.pow(mouseY - canvasY, 2)
    );

    if (distance <= threshold) {
      return point;
    }
  }

  return null;
};
