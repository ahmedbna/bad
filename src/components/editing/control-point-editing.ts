import { Point } from '@/types';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { ControlPoint } from './control-points';
import { worldToCanvas } from '@/utils/worldToCanvas';

export interface ControlPointEditingState {
  isEditing: boolean;
  activeControlPoint: ControlPoint | null;
  originalShape: Doc<'shapes'> | null;
  tempShape: Doc<'shapes'> | null;
  startPosition: Point | null;
}

export const createInitialControlPointEditingState =
  (): ControlPointEditingState => ({
    isEditing: false,
    tempShape: null,
    activeControlPoint: null,
    startPosition: { x: 0, y: 0 },
    originalShape: null,
  });

export const calculateNewShapeFromControlPoint = (
  shape: Doc<'shapes'> & { layer: Doc<'layers'> },
  controlPoint: ControlPoint,
  newPosition: Point,
  originalPosition: Point
): Partial<Doc<'shapes'>> => {
  const deltaX = newPosition.x - originalPosition.x;
  const deltaY = newPosition.y - originalPosition.y;

  switch (shape.type) {
    case 'line':
      if (controlPoint.id === 'start') {
        return {
          points: [newPosition, shape.points[1]],
        };
      } else if (controlPoint.id === 'end') {
        return {
          points: [shape.points[0], newPosition],
        };
      }
      break;

    case 'rectangle':
      const [topLeft, topRight, bottomRight, bottomLeft] = shape.points;

      switch (controlPoint.id) {
        case 'top-left':
          return {
            points: [
              newPosition,
              { x: topRight.x, y: newPosition.y },
              bottomRight,
              { x: newPosition.x, y: bottomLeft.y },
            ],
          };
        case 'top-right':
          return {
            points: [
              { x: topLeft.x, y: newPosition.y },
              newPosition,
              { x: newPosition.x, y: bottomRight.y },
              bottomLeft,
            ],
          };
        case 'bottom-right':
          return {
            points: [
              topLeft,
              { x: newPosition.x, y: topRight.y },
              newPosition,
              { x: bottomLeft.x, y: newPosition.y },
            ],
          };
        case 'bottom-left':
          return {
            points: [
              { x: newPosition.x, y: topLeft.y },
              topRight,
              { x: bottomRight.x, y: newPosition.y },
              newPosition,
            ],
          };
        case 'top-mid':
          return {
            points: [
              { x: topLeft.x, y: newPosition.y },
              { x: topRight.x, y: newPosition.y },
              bottomRight,
              bottomLeft,
            ],
          };
        case 'bottom-mid':
          return {
            points: [
              topLeft,
              topRight,
              { x: bottomRight.x, y: newPosition.y },
              { x: bottomLeft.x, y: newPosition.y },
            ],
          };
        case 'left-mid':
          return {
            points: [
              { x: newPosition.x, y: topLeft.y },
              topRight,
              bottomRight,
              { x: newPosition.x, y: bottomLeft.y },
            ],
          };
        case 'right-mid':
          return {
            points: [
              topLeft,
              { x: newPosition.x, y: topRight.y },
              { x: newPosition.x, y: bottomRight.y },
              bottomLeft,
            ],
          };
      }
      break;

    case 'circle':
      if (controlPoint.property === 'radius') {
        const center = shape.points[0];
        const newRadius = Math.sqrt(
          Math.pow(newPosition.x - center.x, 2) +
            Math.pow(newPosition.y - center.y, 2)
        );

        return {
          properties: {
            ...shape.properties,
            radius: Math.max(1, newRadius),
            diameter: Math.max(2, newRadius * 2),
          },
        };
      }
      break;

    case 'ellipse':
      const ellipseCenter = shape.points[0];
      if (controlPoint.property === 'radiusX') {
        const newRadiusX = Math.abs(newPosition.x - ellipseCenter.x);
        return {
          properties: {
            ...shape.properties,
            radiusX: Math.max(1, newRadiusX),
          },
        };
      } else if (controlPoint.property === 'radiusY') {
        const newRadiusY = Math.abs(newPosition.y - ellipseCenter.y);
        return {
          properties: {
            ...shape.properties,
            radiusY: Math.max(1, newRadiusY),
          },
        };
      }
      break;

    case 'arc':
      const arcCenter = shape.points[0];
      if (controlPoint.property === 'radius') {
        const newRadius = Math.sqrt(
          Math.pow(newPosition.x - arcCenter.x, 2) +
            Math.pow(newPosition.y - arcCenter.y, 2)
        );
        return {
          properties: {
            ...shape.properties,
            radius: Math.max(1, newRadius),
          },
        };
      } else if (controlPoint.property === 'startAngle') {
        const newAngle = Math.atan2(
          newPosition.y - arcCenter.y,
          newPosition.x - arcCenter.x
        );
        return {
          properties: {
            ...shape.properties,
            startAngle: newAngle,
          },
        };
      } else if (controlPoint.property === 'endAngle') {
        const newAngle = Math.atan2(
          newPosition.y - arcCenter.y,
          newPosition.x - arcCenter.x
        );
        return {
          properties: {
            ...shape.properties,
            endAngle: newAngle,
          },
        };
      }
      break;

    case 'polygon':
      if (controlPoint.property === 'radius') {
        const polygonCenter = shape.points[0];
        const newRadius = Math.sqrt(
          Math.pow(newPosition.x - polygonCenter.x, 2) +
            Math.pow(newPosition.y - polygonCenter.y, 2)
        );
        return {
          properties: {
            ...shape.properties,
            radius: Math.max(1, newRadius),
          },
        };
      }
      break;

    case 'polyline':
    case 'spline':
      if (controlPoint.property === 'vertex') {
        const vertexIndex = parseInt(controlPoint.id.split('-')[1]);
        if (!isNaN(vertexIndex) && vertexIndex < shape.points.length) {
          const newPoints = [...shape.points];
          newPoints[vertexIndex] = newPosition;
          return {
            points: newPoints,
          };
        }
      }
      break;
  }

  // Handle center movement for most shapes
  if (controlPoint.type === 'center') {
    const newPoints = shape.points.map((point) => ({
      x: point.x + deltaX,
      y: point.y + deltaY,
    }));

    return {
      points: newPoints,
    };
  }

  return {};
};

export const isValidControlPointEdit = (
  shape: Doc<'shapes'> & { layer: Doc<'layers'> },
  controlPoint: ControlPoint,
  newPosition: Point
): boolean => {
  // Add validation logic here
  // For example, prevent negative dimensions

  switch (shape.type) {
    case 'circle':
      if (controlPoint.property === 'radius') {
        const center = shape.points[0];
        const newRadius = Math.sqrt(
          Math.pow(newPosition.x - center.x, 2) +
            Math.pow(newPosition.y - center.y, 2)
        );
        return newRadius > 0;
      }
      break;

    case 'ellipse':
      const ellipseCenter = shape.points[0];
      if (controlPoint.property === 'radiusX') {
        return Math.abs(newPosition.x - ellipseCenter.x) > 0;
      } else if (controlPoint.property === 'radiusY') {
        return Math.abs(newPosition.y - ellipseCenter.y) > 0;
      }
      break;

    case 'rectangle':
      // Ensure rectangle maintains minimum size
      if (
        controlPoint.id.includes('top') ||
        controlPoint.id.includes('bottom')
      ) {
        const otherY = controlPoint.id.includes('top')
          ? Math.max(...shape.points.map((p) => p.y))
          : Math.min(...shape.points.map((p) => p.y));
        return Math.abs(newPosition.y - otherY) > 1;
      }
      if (
        controlPoint.id.includes('left') ||
        controlPoint.id.includes('right')
      ) {
        const otherX = controlPoint.id.includes('left')
          ? Math.max(...shape.points.map((p) => p.x))
          : Math.min(...shape.points.map((p) => p.x));
        return Math.abs(newPosition.x - otherX) > 1;
      }
      break;
  }

  return true;
};

export const startControlPointEdit = (
  controlPoint: ControlPoint,
  shape: Doc<'shapes'>,
  mousePos: Point
): ControlPointEditingState => {
  return {
    isEditing: true,
    activeControlPoint: controlPoint,
    originalShape: shape,
    tempShape: { ...shape }, // Create a copy for temporary edits
    startPosition: mousePos,
  };
};

export const updateControlPointEdit = (
  editingState: ControlPointEditingState,
  currentMousePos: Point,
  canvasToWorld: (point: Point) => Point
): Doc<'shapes'> | null => {
  if (
    !editingState.isEditing ||
    !editingState.activeControlPoint ||
    !editingState.tempShape
  ) {
    return null;
  }

  const { activeControlPoint, tempShape } = editingState;
  const worldPos = canvasToWorld(currentMousePos);

  // Create updated temp shape based on control point type and shape type
  const updatedShape = { ...tempShape };

  switch (tempShape.type) {
    case 'line':
      if (activeControlPoint.type === 'endpoint') {
        const index = activeControlPoint.metadata?.index || 0;
        updatedShape.points = [...tempShape.points];
        updatedShape.points[index] = worldPos;
      } else if (activeControlPoint.type === 'midpoint') {
        // Move entire line maintaining length and angle
        const dx = worldPos.x - activeControlPoint.x;
        const dy = worldPos.y - activeControlPoint.y;
        updatedShape.points = tempShape.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        }));
      }
      break;

    case 'rectangle':
      if (activeControlPoint.type === 'corner') {
        updatedShape.points = updateRectangleFromCorner(
          tempShape.points,
          activeControlPoint.id,
          worldPos
        );
      } else if (activeControlPoint.type === 'edge') {
        updatedShape.points = updateRectangleFromEdge(
          tempShape.points,
          activeControlPoint,
          worldPos
        );
      } else if (activeControlPoint.type === 'center') {
        const dx = worldPos.x - activeControlPoint.x;
        const dy = worldPos.y - activeControlPoint.y;
        updatedShape.points = tempShape.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        }));
      }
      break;

    case 'circle':
      if (activeControlPoint.type === 'center') {
        updatedShape.points = [worldPos];
      } else if (activeControlPoint.type === 'quadrant') {
        const center = tempShape.points[0];
        const newRadius = Math.sqrt(
          Math.pow(worldPos.x - center.x, 2) +
            Math.pow(worldPos.y - center.y, 2)
        );
        updatedShape.properties = {
          ...tempShape.properties,
          radius: newRadius,
        };
      }
      break;

    case 'arc':
      const arcCenter = tempShape.points[0];
      if (activeControlPoint.type === 'center') {
        updatedShape.points = [worldPos];
      } else if (activeControlPoint.type === 'radius') {
        const newRadius = Math.sqrt(
          Math.pow(worldPos.x - arcCenter.x, 2) +
            Math.pow(worldPos.y - arcCenter.y, 2)
        );
        updatedShape.properties = {
          ...tempShape.properties,
          radius: newRadius,
        };
      } else if (activeControlPoint.type === 'angle') {
        const angle = Math.atan2(
          worldPos.y - arcCenter.y,
          worldPos.x - arcCenter.x
        );
        const angleProperty =
          activeControlPoint.metadata?.angle === 'start'
            ? 'startAngle'
            : 'endAngle';
        updatedShape.properties = {
          ...tempShape.properties,
          [angleProperty]: angle,
        };
      }
      break;

    case 'polyline':
    case 'spline':
      if (activeControlPoint.type === 'center') {
        const dx = worldPos.x - activeControlPoint.x;
        const dy = worldPos.y - activeControlPoint.y;
        updatedShape.points = tempShape.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        }));
      } else if (activeControlPoint.type === 'endpoint') {
        const index = activeControlPoint.metadata?.index || 0;
        updatedShape.points = [...tempShape.points];
        updatedShape.points[index] = worldPos;
      }
      break;
  }

  return updatedShape;
};

export const finishControlPointEdit = (
  editingState: ControlPointEditingState
): { shouldUpdate: boolean; updatedShape: Doc<'shapes'> | null } => {
  if (!editingState.isEditing || !editingState.tempShape) {
    return { shouldUpdate: false, updatedShape: null };
  }

  return {
    shouldUpdate: true,
    updatedShape: editingState.tempShape,
  };
};

// Helper functions for rectangle updates
const updateRectangleFromCorner = (
  points: Point[],
  cornerId: string,
  newPos: Point
): Point[] => {
  const [topLeft, topRight, bottomRight, bottomLeft] = points;

  switch (cornerId) {
    case 'top-left':
      return [
        newPos,
        { x: topRight.x, y: newPos.y },
        bottomRight,
        { x: newPos.x, y: bottomLeft.y },
      ];
    case 'top-right':
      return [
        { x: topLeft.x, y: newPos.y },
        newPos,
        { x: newPos.x, y: bottomRight.y },
        bottomLeft,
      ];
    case 'bottom-right':
      return [
        topLeft,
        { x: newPos.x, y: topRight.y },
        newPos,
        { x: bottomLeft.x, y: newPos.y },
      ];
    case 'bottom-left':
      return [
        { x: newPos.x, y: topLeft.y },
        topRight,
        { x: bottomRight.x, y: newPos.y },
        newPos,
      ];
    default:
      return points;
  }
};

const updateRectangleFromEdge = (
  points: Point[],
  controlPoint: ControlPoint,
  newPos: Point
): Point[] => {
  const [topLeft, topRight, bottomRight, bottomLeft] = points;

  if (controlPoint.metadata?.edge === 'horizontal') {
    if (controlPoint.id.includes('top')) {
      return [
        { x: topLeft.x, y: newPos.y },
        { x: topRight.x, y: newPos.y },
        bottomRight,
        bottomLeft,
      ];
    } else {
      return [
        topLeft,
        topRight,
        { x: bottomRight.x, y: newPos.y },
        { x: bottomLeft.x, y: newPos.y },
      ];
    }
  } else {
    if (controlPoint.id.includes('left')) {
      return [
        { x: newPos.x, y: topLeft.y },
        topRight,
        bottomRight,
        { x: newPos.x, y: bottomLeft.y },
      ];
    } else {
      return [
        topLeft,
        { x: newPos.x, y: topRight.y },
        { x: newPos.x, y: bottomRight.y },
        bottomLeft,
      ];
    }
  }
};

// Temporary shape rendering function
export const renderTempShape = (
  ctx: CanvasRenderingContext2D,
  tempShape: Doc<'shapes'>,
  scale: number,
  offset: Point
) => {
  ctx.save();

  // Use dashed line style for temporary shape
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#ff6b35'; // Orange color for temp shape
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;

  // Convert world coordinates to canvas coordinates
  const canvasPoints = tempShape.points.map((point) =>
    worldToCanvas({ point, scale, offset })
  );

  switch (tempShape.type) {
    case 'line':
      if (canvasPoints.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        ctx.lineTo(canvasPoints[1].x, canvasPoints[1].y);
        ctx.stroke();
      }
      break;

    case 'rectangle':
      if (canvasPoints.length >= 4) {
        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        for (let i = 1; i < canvasPoints.length; i++) {
          ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      break;

    case 'circle':
      if (canvasPoints.length >= 1) {
        const center = canvasPoints[0];
        const radius = (tempShape.properties?.radius || 50) * scale;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;

    case 'arc':
      if (canvasPoints.length >= 1) {
        const center = canvasPoints[0];
        const radius = (tempShape.properties?.radius || 50) * scale;
        const startAngle = tempShape.properties?.startAngle || 0;
        const endAngle = tempShape.properties?.endAngle || Math.PI;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startAngle, endAngle);
        ctx.stroke();
      }
      break;

    case 'polyline':
      if (canvasPoints.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        for (let i = 1; i < canvasPoints.length; i++) {
          ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
        }
        ctx.stroke();
      }
      break;
  }

  ctx.restore();
};

// Updated renderControlPoints to highlight active control point differently
export const renderControlPoints = (
  ctx: CanvasRenderingContext2D,
  controlPoints: ControlPoint[],
  scale: number,
  offset: Point,
  activeControlPointId?: string,
  isEditing?: boolean
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

    const isActive = activeControlPointId === point.id;
    const isEditingActive = isEditing && isActive;

    // Different colors for different control point types
    let strokeColor = '#6b7280'; // Default gray
    let fillColor = 'transparent';

    switch (point.type) {
      case 'endpoint':
        strokeColor = isEditingActive ? '#ef4444' : '#3b82f6'; // Red when editing, blue otherwise
        break;
      case 'center':
        strokeColor = isEditingActive ? '#ef4444' : '#32CD32'; // Red when editing, green otherwise
        break;
      case 'quadrant':
      case 'corner':
        strokeColor = isEditingActive ? '#ef4444' : '#8b5cf6'; // Red when editing, purple otherwise
        break;
      case 'edge':
        strokeColor = isEditingActive ? '#ef4444' : '#f59e0b'; // Red when editing, yellow otherwise
        break;
      case 'midpoint':
        strokeColor = isEditingActive ? '#ef4444' : '#06b6d4'; // Red when editing, cyan otherwise
        break;
      case 'radius':
      case 'angle':
        strokeColor = isEditingActive ? '#ef4444' : '#ec4899'; // Red when editing, pink otherwise
        break;
    }

    if (isActive) {
      fillColor = isEditingActive
        ? 'rgba(239, 68, 68, 0.3)'
        : 'rgba(59, 130, 246, 0.2)';
    }

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = isActive ? 2 : 1;

    ctx.beginPath();

    // Different shapes for different control point types
    if (point.type === 'center') {
      // Circle for center points
      ctx.arc(screenX, screenY, isActive ? size + 1 : size, 0, Math.PI * 2);
    } else if (point.type === 'angle') {
      // Diamond for angle points
      const s = isActive ? size + 1 : size;
      ctx.moveTo(screenX, screenY - s);
      ctx.lineTo(screenX + s, screenY);
      ctx.lineTo(screenX, screenY + s);
      ctx.lineTo(screenX - s, screenY);
      ctx.closePath();
    } else {
      // Square for other points
      const drawSize = isActive ? size + 1 : size;
      ctx.rect(
        screenX - drawSize / 2,
        screenY - drawSize / 2,
        drawSize,
        drawSize
      );
    }

    ctx.fill();
    ctx.stroke();

    // Add pulsing effect when editing
    if (isEditingActive) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  });
};
