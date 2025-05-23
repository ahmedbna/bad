import { Point } from '@/types';
import { Doc } from '@/convex/_generated/dataModel';
import { worldToCanvas } from '@/utils/worldToCanvas';

export interface ControlPoint {
  id: string;
  x: number;
  y: number;
  type: 'resize' | 'move' | 'rotate';
  cursor: string;
  property?: string;
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
      // Start and end points
      controlPoints.push(
        {
          id: 'start',
          x: points[0].x,
          y: points[0].y,
          type: 'resize',
          cursor: 'crosshair',
          property: 'startPoint',
        },
        {
          id: 'end',
          x: points[1].x,
          y: points[1].y,
          type: 'resize',
          cursor: 'crosshair',
          property: 'endPoint',
        }
      );
      break;

    case 'rectangle':
      // Corner points for resizing
      controlPoints.push(
        {
          id: 'top-left',
          x: minX,
          y: minY,
          type: 'resize',
          cursor: 'nw-resize',
          property: 'topLeft',
        },
        {
          id: 'top-right',
          x: maxX,
          y: minY,
          type: 'resize',
          cursor: 'ne-resize',
          property: 'topRight',
        },
        {
          id: 'bottom-left',
          x: minX,
          y: maxY,
          type: 'resize',
          cursor: 'sw-resize',
          property: 'bottomLeft',
        },
        {
          id: 'bottom-right',
          x: maxX,
          y: maxY,
          type: 'resize',
          cursor: 'se-resize',
          property: 'bottomRight',
        },
        // Mid-edge points
        {
          id: 'top-mid',
          x: centerX,
          y: minY,
          type: 'resize',
          cursor: 'n-resize',
          property: 'height',
        },
        {
          id: 'bottom-mid',
          x: centerX,
          y: maxY,
          type: 'resize',
          cursor: 's-resize',
          property: 'height',
        },
        {
          id: 'left-mid',
          x: minX,
          y: centerY,
          type: 'resize',
          cursor: 'w-resize',
          property: 'width',
        },
        {
          id: 'right-mid',
          x: maxX,
          y: centerY,
          type: 'resize',
          cursor: 'e-resize',
          property: 'width',
        }
      );
      break;

    case 'circle':
      const center = points[0];
      const radius = shape.properties?.radius || 50;

      // Radius control points
      controlPoints.push(
        {
          id: 'radius-right',
          x: center.x + radius,
          y: center.y,
          type: 'resize',
          cursor: 'ew-resize',
          property: 'radius',
        },
        {
          id: 'radius-top',
          x: center.x,
          y: center.y - radius,
          type: 'resize',
          cursor: 'ns-resize',
          property: 'radius',
        },
        {
          id: 'radius-left',
          x: center.x - radius,
          y: center.y,
          type: 'resize',
          cursor: 'ew-resize',
          property: 'radius',
        },
        {
          id: 'radius-bottom',
          x: center.x,
          y: center.y + radius,
          type: 'resize',
          cursor: 'ns-resize',
          property: 'radius',
        }
      );
      break;

    case 'ellipse':
      const ellipseCenter = points[0];
      const radiusX = shape.properties?.radiusX || 100;
      const radiusY = shape.properties?.radiusY || 60;
      const rotation = shape.properties?.rotation || 0;

      // Calculate rotated control points
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      controlPoints.push(
        {
          id: 'radiusX-right',
          x: ellipseCenter.x + radiusX * cos,
          y: ellipseCenter.y + radiusX * sin,
          type: 'resize',
          cursor: 'ew-resize',
          property: 'radiusX',
        },
        {
          id: 'radiusX-left',
          x: ellipseCenter.x - radiusX * cos,
          y: ellipseCenter.y - radiusX * sin,
          type: 'resize',
          cursor: 'ew-resize',
          property: 'radiusX',
        },
        {
          id: 'radiusY-top',
          x: ellipseCenter.x - radiusY * sin,
          y: ellipseCenter.y + radiusY * cos,
          type: 'resize',
          cursor: 'ns-resize',
          property: 'radiusY',
        },
        {
          id: 'radiusY-bottom',
          x: ellipseCenter.x + radiusY * sin,
          y: ellipseCenter.y - radiusY * cos,
          type: 'resize',
          cursor: 'ns-resize',
          property: 'radiusY',
        }
      );
      break;

    case 'arc':
      const arcCenter = points[0];
      const arcRadius = shape.properties?.radius || 50;
      const startAngle = shape.properties?.startAngle || 0;
      const endAngle = shape.properties?.endAngle || Math.PI;

      controlPoints.push(
        // Radius control point
        {
          id: 'radius',
          x: arcCenter.x + arcRadius,
          y: arcCenter.y,
          type: 'resize',
          cursor: 'ew-resize',
          property: 'radius',
        },
        // Start angle control point
        {
          id: 'start-angle',
          x: arcCenter.x + arcRadius * Math.cos(startAngle),
          y: arcCenter.y + arcRadius * Math.sin(startAngle),
          type: 'resize',
          cursor: 'crosshair',
          property: 'startAngle',
        },
        // End angle control point
        {
          id: 'end-angle',
          x: arcCenter.x + arcRadius * Math.cos(endAngle),
          y: arcCenter.y + arcRadius * Math.sin(endAngle),
          type: 'resize',
          cursor: 'crosshair',
          property: 'endAngle',
        }
      );
      break;

    case 'polygon':
      const polygonCenter = points[0];
      const polygonRadius = shape.properties?.radius || 50;
      const sides = shape.properties?.sides || 6;

      // Create control points for each vertex
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        controlPoints.push({
          id: `vertex-${i}`,
          x: polygonCenter.x + polygonRadius * Math.cos(angle),
          y: polygonCenter.y + polygonRadius * Math.sin(angle),
          type: 'resize',
          cursor: 'crosshair',
          property: 'radius',
        });
      }
      break;

    case 'polyline':
    case 'spline':
      // Control points for each vertex
      points.forEach((point, index) => {
        controlPoints.push({
          id: `vertex-${index}`,
          x: point.x,
          y: point.y,
          type: 'resize',
          cursor: 'crosshair',
          property: 'vertex',
        });
      });
      break;
  }

  // Add center move point for all shapes (except line which moves by endpoints)
  if (
    shape.type !== 'line' &&
    shape.type !== 'polyline' &&
    shape.type !== 'spline'
  ) {
    controlPoints.push({
      id: 'center',
      x: centerX,
      y: centerY,
      type: 'move',
      cursor: 'move',
    });
  }

  return { controlPoints, bounds };
};

// Updated renderControlPoints function - fix coordinate transformation
export const renderControlPoints = (
  ctx: CanvasRenderingContext2D,
  controlPoints: ControlPoint[],
  scale: number,
  offset: Point
) => {
  // Control point size - keep consistent regardless of zoom level
  const size = 7;

  controlPoints.forEach((point) => {
    // Convert world coordinates to canvas coordinates using your coordinate system
    const canvasPos = worldToCanvas({
      point: { x: point.x, y: point.y },
      scale,
      offset,
    });
    const screenX = canvasPos.x;
    const screenY = canvasPos.y;

    ctx.save();

    // Set styles based on control point type
    switch (point.type) {
      case 'resize':
        ctx.strokeStyle = '#3b82f6'; // Blue for resize handles
        ctx.fillStyle = 'transparent';
        break;
      case 'move':
        ctx.strokeStyle = '#32CD32'; // Green for move handles
        ctx.fillStyle = 'transparent';
        break;
      case 'rotate':
        ctx.strokeStyle = '#f59e0b'; // Orange for rotate handles
        ctx.fillStyle = 'transparent';

        break;
      default:
        ctx.strokeStyle = '#6b7280'; // Gray for other handles
        ctx.fillStyle = 'transparent';
    }

    ctx.lineWidth = 1;

    ctx.beginPath();
    if (point.type === 'rotate') {
      // Draw circle for rotation handles
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
    } else {
      // Draw square for resize/move handles (centered like old function)
      ctx.rect(screenX - size / 2, screenY - size / 2, size, size);
    }

    ctx.fill();
    ctx.stroke();

    ctx.restore();
  });
};

// Updated getControlPointAtPosition function - fix coordinate comparison
export const getControlPointAtPosition = (
  controlPoints: ControlPoint[],
  mouseX: number,
  mouseY: number,
  scale: number,
  offset: Point,
  threshold: number = 12
): ControlPoint | null => {
  for (const point of controlPoints) {
    // Convert control point world coordinates to canvas coordinates using your coordinate system
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
