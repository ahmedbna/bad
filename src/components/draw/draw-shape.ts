import { DimensionParams, Point, ShapeProperties, TextParams } from '@/types';
import { Shape } from '@/types';
import { worldToCanvas } from '@/utils/worldToCanvas';

type Props = {
  ctx: CanvasRenderingContext2D;
  scale: number;
  offset: Point;
  shape: Shape;
  isSelected: boolean;
  isTemporary: boolean;
};

// Helper function to create regular polygon points
const calculatePolygonPoints = (
  center: Point,
  radius: number,
  sides: number
): Point[] => {
  const points: Point[] = [];
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }

  return points;
};

// Helper function to draw a spline (using cardinal spline for simplicity)
const drawSpline = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  tension = 0.5
) => {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    // Just draw a line if only two points
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  // Draw a Cardinal spline through the points
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    // Calculate control points
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;

    // Draw cubic bezier curve
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
};

// Draw shape
export const drawShape = ({
  ctx,
  shape,
  isSelected,
  scale,
  offset,
  isTemporary = false,
}: Props) => {
  ctx.strokeStyle = isSelected ? '#2563eb' : isTemporary ? '#9ca3af' : '#000';
  ctx.lineWidth = isSelected ? 2 : 1;

  // Add a fill color with transparency for temporary shapes to improve visual feedback
  if (isTemporary) {
    ctx.fillStyle = 'rgba(156, 163, 175, 0.1)';
  } else {
    ctx.fillStyle = isSelected ? 'rgba(37, 99, 235, 0.1)' : 'rgba(0, 0, 0, 0)';
  }

  switch (shape.type) {
    case 'line':
      if (shape.points.length >= 2) {
        const start = worldToCanvas({ point: shape.points[0], scale, offset });
        const end = worldToCanvas({ point: shape.points[1], scale, offset });

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          drawControlPoints(ctx, [start, end]);
        }
      }
      break;

    case 'rectangle':
      if (shape.points.length >= 2) {
        const start = worldToCanvas({ point: shape.points[0], scale, offset });
        const end = worldToCanvas({ point: shape.points[1], scale, offset });

        const width = end.x - start.x;
        const height = end.y - start.y;

        ctx.beginPath();
        ctx.rect(start.x, start.y, width, height);
        ctx.fill();
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          const controlPoints = [
            start,
            { x: start.x + width, y: start.y },
            end,
            { x: start.x, y: start.y + height },
          ];
          drawControlPoints(ctx, controlPoints);
        }
      }
      break;

    case 'circle':
      if (shape.points.length >= 1 && shape.properties?.radius) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = shape.properties.radius * scale;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          // Draw center point
          drawControlPoint(ctx, center);

          // Draw radius control point
          const radiusPoint = {
            x: center.x + radius,
            y: center.y,
          };
          drawControlPoint(ctx, radiusPoint);

          // Draw a line connecting center to radius point
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(radiusPoint.x, radiusPoint.y);
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      break;

    case 'arc':
      if (shape.points.length >= 1) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = (shape.properties?.radius || 0) * scale;
        const startAngle = shape.properties?.startAngle || 0;
        const endAngle = shape.properties?.endAngle || Math.PI * 2;
        const isClockwise = shape.properties?.isClockwise || false;

        // If it's a temporary shape and has the isDashed property, use dashed lines
        // if (isTemporary && shape.properties?.isDashed) {
        //   ctx.setLineDash([5, 5]);
        // }

        ctx.beginPath();

        // In HTML5 Canvas, true = counterclockwise, false = clockwise
        // But in our internal logic, isClockwise has the opposite meaning
        // So we need to invert the flag here
        ctx.arc(center.x, center.y, radius, startAngle, endAngle, !isClockwise);

        ctx.stroke();

        // Reset dashed line setting
        // if (isTemporary && shape.properties?.isDashed) {
        //   ctx.setLineDash([]);
        // }

        // Draw control points when selected
        if (isSelected) {
          // Draw center point
          drawControlPoint(ctx, center);

          // Draw start and end points of the arc
          const startPoint = {
            x: center.x + radius * Math.cos(startAngle),
            y: center.y + radius * Math.sin(startAngle),
          };

          const endPoint = {
            x: center.x + radius * Math.cos(endAngle),
            y: center.y + radius * Math.sin(endAngle),
          };

          drawControlPoint(ctx, startPoint);
          drawControlPoint(ctx, endPoint);

          // Draw radial lines
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(startPoint.x, startPoint.y);
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw a small indicator showing the arc direction
          const midAngle = isClockwise
            ? (startAngle + endAngle) / 2 + Math.PI
            : (startAngle + endAngle) / 2;

          const midRadius = radius * 0.9;
          const arrowSize = 8;

          const arrowPoint = {
            x: center.x + midRadius * Math.cos(midAngle),
            y: center.y + midRadius * Math.sin(midAngle),
          };

          const tangentAngle = midAngle + Math.PI / 2;

          ctx.beginPath();
          ctx.moveTo(arrowPoint.x, arrowPoint.y);
          ctx.lineTo(
            arrowPoint.x + arrowSize * Math.cos(tangentAngle - Math.PI / 6),
            arrowPoint.y + arrowSize * Math.sin(tangentAngle - Math.PI / 6)
          );
          ctx.moveTo(arrowPoint.x, arrowPoint.y);
          ctx.lineTo(
            arrowPoint.x + arrowSize * Math.cos(tangentAngle + Math.PI / 6),
            arrowPoint.y + arrowSize * Math.sin(tangentAngle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }
      break;

    case 'ellipse':
      if (
        shape.points.length >= 1 &&
        shape.properties?.radiusX &&
        shape.properties?.radiusY
      ) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radiusX = shape.properties.radiusX * scale;
        const radiusY = shape.properties.radiusY * scale;
        const rotation = shape.properties.rotation || 0;
        const startAngle = shape.properties.startAngle || 0;
        const endAngle = shape.properties.isFullEllipse
          ? Math.PI * 2
          : shape.properties.endAngle || Math.PI * 2;

        ctx.beginPath();
        ctx.ellipse(
          center.x,
          center.y,
          radiusX,
          radiusY,
          rotation,
          startAngle,
          endAngle
        );
        ctx.fill();
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          // Draw center point
          drawControlPoint(ctx, center);

          // Draw x-radius and y-radius control points
          const radiusXPoint = {
            x: center.x + radiusX * Math.cos(rotation),
            y: center.y + radiusX * Math.sin(rotation),
          };

          const radiusYPoint = {
            x: center.x + radiusY * Math.cos(rotation + Math.PI / 2),
            y: center.y + radiusY * Math.sin(rotation + Math.PI / 2),
          };

          drawControlPoint(ctx, radiusXPoint);
          drawControlPoint(ctx, radiusYPoint);

          // Draw axis lines
          ctx.beginPath();
          ctx.moveTo(
            center.x - radiusX * Math.cos(rotation),
            center.y - radiusX * Math.sin(rotation)
          );
          ctx.lineTo(
            center.x + radiusX * Math.cos(rotation),
            center.y + radiusX * Math.sin(rotation)
          );
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(
            center.x - radiusY * Math.cos(rotation + Math.PI / 2),
            center.y - radiusY * Math.sin(rotation + Math.PI / 2)
          );
          ctx.lineTo(
            center.x + radiusY * Math.cos(rotation + Math.PI / 2),
            center.y + radiusY * Math.sin(rotation + Math.PI / 2)
          );
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      break;

    case 'polygon':
      if (
        shape.points.length >= 1 &&
        shape.properties?.radius &&
        shape.properties?.sides
      ) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = shape.properties.radius * scale;
        const sides = shape.properties.sides;
        const points = calculatePolygonPoints(
          { x: center.x, y: center.y },
          radius,
          sides
        );

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          // Draw center point
          drawControlPoint(ctx, center);

          // Draw all vertices
          drawControlPoints(ctx, points);

          // Draw a radius line
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(points[0].x, points[0].y);
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      break;

    case 'polyline':
      if (shape.points.length >= 2) {
        const points = shape.points.map((point) =>
          worldToCanvas({ point, scale, offset })
        );

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }

        if (shape.properties?.isClosed) {
          ctx.closePath();
          ctx.fill();
        }

        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          drawControlPoints(ctx, points);
        }
      }
      break;

    case 'spline':
      if (shape.points.length >= 2) {
        const points = shape.points.map((point) =>
          worldToCanvas({ point, scale, offset })
        );

        ctx.beginPath();
        drawSpline(ctx, points, shape.properties?.tension || 0.5);

        if (shape.properties?.isClosed) {
          // Connect back to start for closed splines
          const lastPoint = points[points.length - 1];
          const firstPoint = points[0];

          // Calculate control points for closing segment
          const tensionFactor = (shape.properties?.tension || 0.5) / 6;
          const secondLastPoint = points[points.length - 2];
          const secondPoint = points[1];

          const cp1x =
            lastPoint.x + (firstPoint.x - secondLastPoint.x) * tensionFactor;
          const cp1y =
            lastPoint.y + (firstPoint.y - secondLastPoint.y) * tensionFactor;
          const cp2x =
            firstPoint.x - (secondPoint.x - lastPoint.x) * tensionFactor;
          const cp2y =
            firstPoint.y - (secondPoint.y - lastPoint.y) * tensionFactor;

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, firstPoint.x, firstPoint.y);
          ctx.fill();
        }

        ctx.stroke();

        // Draw control points when selected
        if (isSelected) {
          drawControlPoints(ctx, points);
        }
      }
      break;

    case 'text':
      drawText(ctx, scale, offset, shape, isSelected, isTemporary);
      break;
    case 'dimension':
      drawDimension(ctx, scale, offset, shape, isSelected, isTemporary);
      break;

    default:
      break;
  }
};

// Helper function to draw a control point
const drawControlPoint = (ctx: CanvasRenderingContext2D, point: Point) => {
  const size = 6;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.rect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.fill();
  ctx.stroke();
};

// Helper function to draw multiple control points
const drawControlPoints = (ctx: CanvasRenderingContext2D, points: Point[]) => {
  points.forEach((point) => drawControlPoint(ctx, point));
};

// Now let's create the text rendering functions in draw-shape.ts
export const drawText = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  offset: Point,
  shape: Shape,
  isSelected: boolean,
  isTemporary: boolean
) => {
  const { points, properties } = shape;
  if (!points.length) return;

  const position = points[0];
  const textProps = properties as TextParams;

  // Transform canvas coordinates
  const x = offset.x + position.x * scale;
  const y = offset.y - position.y * scale; // Invert Y coordinate

  // Set text styles
  ctx.font = `${textProps.fontStyle} ${textProps.fontWeight} ${textProps.fontSize * scale}px ${textProps.fontFamily}`;
  ctx.fillStyle = isTemporary ? 'rgba(0, 120, 212, 0.7)' : 'black';
  ctx.textAlign = textProps.justification;
  ctx.textBaseline = 'middle';

  // Apply rotation if specified
  if (textProps.rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((-textProps.rotation * Math.PI) / 180); // Convert degrees to radians
    ctx.fillText(textProps.content, 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(textProps.content, x, y);
  }

  // Draw selection indicators if selected
  if (isSelected) {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 1;

    // Get text metrics to calculate bounding box
    const metrics = ctx.measureText(textProps.content);
    const textHeight = textProps.fontSize * scale;
    const textWidth = metrics.width;

    // Draw text bounding box
    ctx.strokeRect(
      x -
        (textProps.justification === 'center'
          ? textWidth / 2
          : textProps.justification === 'right'
            ? textWidth
            : 0),
      y - textHeight / 2,
      textWidth,
      textHeight
    );

    // Draw control points
    const controlPoints = [
      { x, y }, // Position point
      { x: x + textWidth, y }, // Width point
    ];

    controlPoints.forEach((point) => {
      ctx.fillStyle = 'blue';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
};

// Create dimension line drawing function in draw-shape.ts
export const drawDimension = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  offset: Point,
  shape: Shape,
  isSelected: boolean,
  isTemporary: boolean
) => {
  const { points, properties } = shape;
  if (points.length < 2) return;

  const startPoint = points[0];
  const endPoint = points[1];
  const dimProps = properties as DimensionParams;

  // Transform canvas coordinates
  const x1 = offset.x + startPoint.x * scale;
  const y1 = offset.y - startPoint.y * scale;
  const x2 = offset.x + endPoint.x * scale;
  const y2 = offset.y - endPoint.y * scale;

  ctx.strokeStyle = isTemporary ? 'rgba(0, 120, 212, 0.7)' : 'black';
  ctx.lineWidth = 1;

  // For linear dimensions
  if (dimProps.dimensionType === 'linear') {
    // Calculate dimension line offset position
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;

    // Dimension line offset from the measured line
    const offsetDistance = dimProps.offset * scale;

    // Calculate extension line points
    const extLine1Start = {
      x: x1 + Math.cos(perpAngle) * dimProps.extensionLineOffset * scale,
      y: y1 + Math.sin(perpAngle) * dimProps.extensionLineOffset * scale,
    };

    const extLine1End = {
      x: x1 + Math.cos(perpAngle) * offsetDistance,
      y: y1 + Math.sin(perpAngle) * offsetDistance,
    };

    const extLine2Start = {
      x: x2 + Math.cos(perpAngle) * dimProps.extensionLineOffset * scale,
      y: y2 + Math.sin(perpAngle) * dimProps.extensionLineOffset * scale,
    };

    const extLine2End = {
      x: x2 + Math.cos(perpAngle) * offsetDistance,
      y: y2 + Math.sin(perpAngle) * offsetDistance,
    };

    // Draw extension lines
    ctx.beginPath();
    ctx.moveTo(extLine1Start.x, extLine1Start.y);
    ctx.lineTo(extLine1End.x, extLine1End.y);
    ctx.moveTo(extLine2Start.x, extLine2Start.y);
    ctx.lineTo(extLine2End.x, extLine2End.y);
    ctx.stroke();

    // Draw dimension line
    ctx.beginPath();
    ctx.moveTo(extLine1End.x, extLine1End.y);
    ctx.lineTo(extLine2End.x, extLine2End.y);
    ctx.stroke();

    // Draw arrows
    const arrowSize = dimProps.arrowSize * scale;
    drawArrow(ctx, extLine1End, extLine2End, arrowSize);
    drawArrow(ctx, extLine2End, extLine1End, arrowSize);

    // Calculate and draw dimension text
    const distance = Math.sqrt(dx * dx + dy * dy);
    const textToDisplay = dimProps.showValue
      ? distance.toFixed(dimProps.precision) + (dimProps.units || '')
      : dimProps.value.toFixed(dimProps.precision) + (dimProps.units || '');

    // Text position
    const textX = (extLine1End.x + extLine2End.x) / 2;
    const textY = (extLine1End.y + extLine2End.y) / 2;

    // Draw text
    ctx.save();
    ctx.font = `${dimProps.textHeight * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Rotate text if needed
    if (dimProps.textRotation) {
      ctx.translate(textX, textY);
      ctx.rotate((-dimProps.textRotation * Math.PI) / 180);
      ctx.fillText(textToDisplay, 0, 0);
    } else {
      // Align text with dimension line
      ctx.translate(textX, textY);
      ctx.rotate(-angle);
      ctx.fillText(textToDisplay, 0, (-dimProps.textHeight * scale) / 2);
    }
    ctx.restore();
  }

  // Draw radius dimension
  else if (dimProps.dimensionType === 'radius') {
    // Center point is start point, radius point is end point
    const centerX = x1;
    const centerY = y1;
    const radiusPointX = x2;
    const radiusPointY = y2;

    // Calculate radius
    const dx = radiusPointX - centerX;
    const dy = radiusPointY - centerY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Draw radius line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(radiusPointX, radiusPointY);
    ctx.stroke();

    // Draw arrow
    drawArrow(
      ctx,
      { x: radiusPointX, y: radiusPointY },
      { x: centerX, y: centerY },
      dimProps.arrowSize * scale
    );

    // Calculate text position
    const textX = centerX + Math.cos(angle) * radius * 0.6;
    const textY = centerY + Math.sin(angle) * radius * 0.6;

    // Draw text
    ctx.save();
    ctx.font = `${dimProps.textHeight * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `R${radius.toFixed(dimProps.precision)}${dimProps.units || ''}`,
      textX,
      textY
    );
    ctx.restore();
  }

  // Draw selected state
  if (isSelected) {
    points.forEach((point) => {
      const px = offset.x + point.x * scale;
      const py = offset.y - point.y * scale;

      ctx.fillStyle = 'blue';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw text position control handle
    if (dimProps.textPosition) {
      const textX = offset.x + dimProps.textPosition.x * scale;
      const textY = offset.y - dimProps.textPosition.y * scale;

      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.arc(textX, textY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// Helper function to draw arrows
const drawArrow = (
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  size: number
) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(
    from.x - size * Math.cos(angle - Math.PI / 6),
    from.y - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    from.x - size * Math.cos(angle + Math.PI / 6),
    from.y - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
};

/**
 * Utility function to create a default text shape
 */
export const createDefaultTextShape = (
  point: Point,
  textParams?: TextParams
): Shape => {
  return {
    id: `text-${Date.now()}`,
    type: 'text',
    points: [point],
    properties: {
      textParams: {
        content: textParams?.content || 'Sample Text',
        fontSize: textParams?.fontSize || 12,
        fontFamily: textParams?.fontFamily || 'Arial',
        fontStyle: textParams?.fontStyle || 'normal',
        fontWeight: textParams?.fontWeight || 'normal',
        rotation: textParams?.rotation || 0,
        justification: textParams?.justification || 'left',
      },
    },
    isCompleted: true,
  };
};

/**
 * Utility function to create a temporary dimension shape
 */
export const createTempDimensionShape = (
  point: Point,
  dimensionParams?: DimensionParams
): Shape => {
  return {
    id: `temp-dim-${Date.now()}`,
    type: 'dimension',
    points: [point],
    properties: {
      dimensionParams: {
        dimensionType: dimensionParams?.dimensionType || 'linear',
        offset: dimensionParams?.offset || 25,
        extensionLineOffset: dimensionParams?.extensionLineOffset || 5,
        arrowSize: dimensionParams?.arrowSize || 8,
        textHeight: dimensionParams?.textHeight || 12,
        precision: dimensionParams?.precision || 2,
        units: dimensionParams?.units || '',
        showValue:
          dimensionParams?.showValue !== undefined
            ? dimensionParams.showValue
            : true,
        textRotation: dimensionParams?.textRotation || 0,
        value: 0,
      },
    },
    isCompleted: false,
  };
};

/**
 * Utility function to calculate dimension properties for completion
 */
export const calculateDimensionProperties = (
  startPoint: Point,
  endPoint: Point,
  dimensionParams?: DimensionParams
): ShapeProperties => {
  // Calculate distance
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate the midpoint for text position
  const midPoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  };

  // Get perpendicular offset for text
  const angle = Math.atan2(dy, dx);
  const perpAngle = angle + Math.PI / 2;
  const offsetAmount = dimensionParams?.offset || 25;

  // Calculate text position
  const textPosition = {
    x: midPoint.x + Math.cos(perpAngle) * offsetAmount,
    y: midPoint.y + Math.sin(perpAngle) * offsetAmount,
  };

  return {
    dimensionParams: {
      dimensionType: dimensionParams?.dimensionType || 'linear',
      offset: dimensionParams?.offset || 25,
      extensionLineOffset: dimensionParams?.extensionLineOffset || 5,
      arrowSize: dimensionParams?.arrowSize || 8,
      textHeight: dimensionParams?.textHeight || 12,
      precision: dimensionParams?.precision || 2,
      units: dimensionParams?.units || '',
      showValue:
        dimensionParams?.showValue !== undefined
          ? dimensionParams.showValue
          : true,
      textRotation: dimensionParams?.textRotation || 0,
      value: distance,
      textPosition: textPosition,
    },
  };
};
