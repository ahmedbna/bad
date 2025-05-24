import { Point } from '@/types';
import { worldToCanvas } from '@/utils/worldToCanvas';
import { EditingState } from '@/components/editing/constants';
import { Doc } from '@/convex/_generated/dataModel';
import {
  ControlPointsResult,
  renderControlPoints,
} from '../editing/control-points';
import { ControlPointEditingState } from '../editing/control-point-editing';

type Props = {
  ctx: CanvasRenderingContext2D;
  scale: number;
  offset: Point;
  shape: Doc<'shapes'> & { layer: Doc<'layers'> };
  isSelected: boolean;
  isTemporary: boolean;
  editingState: EditingState;
  theme?: string;
  currentControlPoints: ControlPointsResult;
  controlPointEditing: ControlPointEditingState;
};

export const drawShape = ({
  ctx,
  shape,
  isSelected,
  scale,
  offset,
  isTemporary = false,
  editingState,
  theme = 'dark',
  currentControlPoints,
  controlPointEditing,
}: Props) => {
  // Set styles based on selection and editing state
  const isEditingSelected =
    editingState.isActive && editingState.selectedIds.includes(shape._id);

  ctx.strokeStyle =
    isSelected && !editingState.isActive
      ? '#2563eb'
      : isTemporary
        ? '#9ca3af'
        : shape.layer.color;

  ctx.lineWidth =
    isSelected && !editingState.isActive ? 2 : shape.layer.lineWidth;

  // Add a fill color with transparency for temporary shapes to improve visual feedback
  if (isTemporary) {
    ctx.fillStyle = 'rgba(156, 163, 175, 0.1)';
  } else {
    ctx.fillStyle = isSelected ? 'rgba(37, 99, 235, 0.1)' : 'rgba(0, 0, 0, 0)';
  }

  // Editing selection style - different for different editing operations
  if (isEditingSelected) {
    switch (editingState.tool) {
      case 'move':
      case 'copy':
        ctx.strokeStyle = '#9333ea'; // Purple for move/copy
        break;
      case 'rotate':
        ctx.strokeStyle = '#ea580c'; // Orange for rotate
        break;
      case 'mirror':
        ctx.strokeStyle = '#16a34a'; // Green for mirror
        break;
      case 'offset':
        ctx.strokeStyle = '#dc2626'; // Red for offset
        break;
      default:
        ctx.strokeStyle = '#2563eb'; // Default blue
    }
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
      }
      break;

    case 'arc':
      if (shape.points.length >= 1) {
        const center = worldToCanvas({ point: shape.points[0], scale, offset });
        const radius = (shape.properties?.radius || 0) * scale;
        const startAngle = shape.properties?.startAngle || 0;
        const endAngle = shape.properties?.endAngle || Math.PI * 2;
        const isClockwise = shape.properties?.isClockwise || false;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startAngle, endAngle, !isClockwise);
        ctx.stroke();
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
          const lastPoint = points[points.length - 1];
          const firstPoint = points[0];

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

  // Render control points when shape is selected and not in editing mode
  if (isSelected && !editingState.isActive && !isTemporary) {
    renderControlPoints(
      ctx,
      currentControlPoints.controlPoints,
      scale,
      offset,
      controlPointEditing.activeControlPoint?.id
    );
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

/**
 * Draws text on the canvas
 */
export const drawText = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  offset: Point,
  shape: Doc<'shapes'> & { layer: Doc<'layers'> },
  isSelected: boolean,
  isTemporary: boolean
) => {
  try {
    if (!shape.points || shape.points.length < 1) return;
    if (!shape.properties?.textParams) return;

    const textParams = shape.properties.textParams;
    const point = worldToCanvas({
      point: shape.points[0],
      scale,
      offset,
    });

    // Save the current state
    ctx.save();

    // Apply text styling
    ctx.font = `${textParams.fontStyle} ${textParams.fontWeight} ${textParams.fontSize! * scale}px ${textParams.fontFamily}`;
    ctx.fillStyle = isSelected
      ? '#2563eb'
      : isTemporary
        ? '#9ca3af'
        : shape.layer.color;

    // Apply rotation if needed
    if (textParams.rotation !== 0) {
      ctx.translate(point.x, point.y);
      ctx.rotate((textParams.rotation! * Math.PI) / 180);
      ctx.translate(-point.x, -point.y);
    }

    // Set text alignment
    ctx.textAlign = textParams.justification as CanvasTextAlign;
    ctx.textBaseline = 'middle';

    // Draw the text
    ctx.fillText(textParams.content ?? '', point.x, point.y);

    // Draw selection handles if selected
    if (isSelected) {
      // Calculate text width for bounding box
      const textWidth = ctx.measureText(textParams.content ?? 'Text').width;
      const textHeight = textParams.fontSize! * scale;

      // Draw bounding box (for selection visualization)
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1;

      // Adjust bounding box position based on justification
      let boxX = point.x;
      if (textParams.justification === 'center') {
        boxX -= textWidth / 2;
      } else if (textParams.justification === 'right') {
        boxX -= textWidth;
      }

      ctx.strokeRect(boxX, point.y - textHeight / 2, textWidth, textHeight);

      // Draw handle at the text position
      drawHandle(ctx, point.x, point.y);
    }

    // Restore the context
    ctx.restore();
  } catch (error) {
    console.error('Error drawing text:', error);
  }
};

/**
 * Draws dimension on the canvas
 */
export const drawDimension = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  offset: Point,
  shape: Doc<'shapes'> & { layer: Doc<'layers'> },
  isSelected: boolean,
  isTemporary: boolean
) => {
  try {
    if (!shape.points || shape.points.length < 2) return;
    if (!shape.properties?.dimensionParams) return;

    const dimensionParams = shape.properties.dimensionParams;
    const startPoint = worldToCanvas({
      point: shape.points[0],
      scale,
      offset,
    });
    const endPoint = worldToCanvas({
      point: shape.points[1],
      scale,
      offset,
    });

    // Save the current state
    ctx.save();

    // Set drawing styles
    ctx.strokeStyle = isSelected
      ? '#2563eb'
      : isTemporary
        ? '#9ca3af'
        : shape.layer.color;

    ctx.lineWidth = isSelected ? 2 : shape.layer.lineWidth;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = isSelected ? 2 : 1;

    if (!dimensionParams) return;

    // Draw based on dimension type
    switch (dimensionParams.dimensionType) {
      case 'linear':
        drawLinearDimension(
          ctx,
          scale,
          startPoint,
          endPoint,
          dimensionParams,
          isSelected
        );
        break;
      case 'angular':
        drawAngularDimension(
          ctx,
          scale,
          startPoint,
          endPoint,
          dimensionParams,
          isSelected
        );
        break;
      case 'radius':
        drawRadiusDimension(
          ctx,
          scale,
          startPoint,
          endPoint,
          dimensionParams,
          isSelected
        );
        break;
      case 'diameter':
        drawDiameterDimension(
          ctx,
          scale,
          startPoint,
          endPoint,
          dimensionParams,
          isSelected
        );
        break;
      default:
        drawLinearDimension(
          ctx,
          scale,
          startPoint,
          endPoint,
          dimensionParams,
          isSelected
        );
    }

    // Restore the context
    ctx.restore();

    // Draw selection handles if selected
    if (isSelected) {
      drawHandle(ctx, startPoint.x, startPoint.y);
      drawHandle(ctx, endPoint.x, endPoint.y);

      // Draw handle at text position if available
      if (dimensionParams.textPosition) {
        const textPoint = worldToCanvas({
          point: dimensionParams.textPosition,
          scale,
          offset,
        });
        drawHandle(ctx, textPoint.x, textPoint.y);
      }
    }
  } catch (error) {
    console.error('Error drawing dimension:', error);
  }
};

/**
 * Draws a linear dimension
 */
const drawLinearDimension = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  startPoint: Point,
  endPoint: Point,
  dimensionParams: any,
  isSelected: boolean
) => {
  // Calculate dimension line angle
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const angle = Math.atan2(dy, dx);
  const perpAngle = angle + Math.PI / 2;

  // Calculate the actual distance (unscaled) to display
  const actualDistance = Math.sqrt(dx * dx + dy * dy) / scale;

  // Use the provided value if available, otherwise calculate it
  const measurementValue = dimensionParams.value || actualDistance;

  // Convert offset to canvas scale
  const offset = (dimensionParams.offset || 25) * scale;
  const extLineOffset = (dimensionParams.extensionLineOffset || 5) * scale;
  const arrowSize = (dimensionParams.arrowSize || 8) * scale;

  // Calculate offset points for dimension line
  const startOffsetX = Math.cos(perpAngle) * offset;
  const startOffsetY = Math.sin(perpAngle) * offset;

  const dimLineStart = {
    x: startPoint.x + startOffsetX,
    y: startPoint.y + startOffsetY,
  };

  const dimLineEnd = {
    x: endPoint.x + startOffsetX,
    y: endPoint.y + startOffsetY,
  };

  // Draw extension lines
  drawExtensionLine(ctx, startPoint, dimLineStart, extLineOffset);
  drawExtensionLine(ctx, endPoint, dimLineEnd, extLineOffset);

  // Draw dimension line
  ctx.beginPath();
  ctx.moveTo(dimLineStart.x, dimLineStart.y);
  ctx.lineTo(dimLineEnd.x, dimLineEnd.y);
  ctx.stroke();

  // Draw arrows
  drawArrow(ctx, dimLineStart, angle, arrowSize);
  drawArrow(ctx, dimLineEnd, angle + Math.PI, arrowSize);

  // Draw measurement text
  if (dimensionParams.showValue !== false) {
    // Default to showing value if not specified
    // Get text position - either from params or calculate midpoint
    let textPosition;

    if (dimensionParams.textPosition) {
      // If textPosition is in world coordinates, convert to canvas coordinates
      textPosition = worldToCanvas({
        point: dimensionParams.textPosition,
        scale,
        offset: { x: 0, y: 0 }, // offset should be passed from the parent function
      });
    } else {
      // Default to middle of dimension line
      textPosition = {
        x: (dimLineStart.x + dimLineEnd.x) / 2,
        y: (dimLineStart.y + dimLineEnd.y) / 2,
      };
    }

    // Format the value according to precision
    const precision =
      dimensionParams.precision !== undefined ? dimensionParams.precision : 2;
    const formattedValue = measurementValue.toFixed(precision);
    const units = dimensionParams.units || '';
    const displayText = `${formattedValue}${units}`;

    // Draw text
    ctx.save();

    // Set font with explicit size
    const textHeight = (dimensionParams.textHeight || 12) * scale;
    ctx.font = `${textHeight}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate text dimensions for background
    const textMetrics = ctx.measureText(displayText);
    const textWidth = textMetrics.width;

    // Apply rotation if specified
    if (
      dimensionParams.textRotation !== undefined &&
      dimensionParams.textRotation !== 0
    ) {
      ctx.translate(textPosition.x, textPosition.y);
      ctx.rotate((dimensionParams.textRotation * Math.PI) / 180);
      ctx.translate(-textPosition.x, -textPosition.y);
    }

    // Create a background for the text
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      textPosition.x - textWidth / 2 - 4,
      textPosition.y - textHeight / 2 - 2,
      textWidth + 8,
      textHeight + 4
    );

    // Break dimension line if text is centered on it and no custom position
    if (!dimensionParams.textPosition) {
      const padding = 4;
      const halfTextWidth = textWidth / 2 + padding;

      // Clear the existing dimension line
      ctx.beginPath();
      ctx.moveTo(dimLineStart.x, dimLineStart.y);
      ctx.lineTo(textPosition.x - halfTextWidth, textPosition.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(textPosition.x + halfTextWidth, textPosition.y);
      ctx.lineTo(dimLineEnd.x, dimLineEnd.y);
      ctx.stroke();
    }

    // Draw the text
    ctx.fillStyle = isSelected ? '#2563eb' : '#000000';
    ctx.fillText(displayText, textPosition.x, textPosition.y);
    ctx.restore();
  }
};

/**
 * Draws an angular dimension
 */
const drawAngularDimension = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  startPoint: Point,
  endPoint: Point,
  dimensionParams: any,
  isSelected: boolean
) => {
  // For angular dimensions, we interpret points differently:
  // startPoint is considered the vertex
  // endPoint is considered a point on one of the rays

  // This is a simplified implementation - a complete one would need a third point
  // to define the angle, but we'll use a fixed reference angle for simplicity

  const radius = dimensionParams.offset * scale;
  const arrowSize = dimensionParams.arrowSize * scale;

  // Calculate the angle between the points
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const angle = Math.atan2(dy, dx);

  // Draw the arc
  ctx.beginPath();
  ctx.arc(startPoint.x, startPoint.y, radius, 0, angle, false);
  ctx.stroke();

  // Draw arrows at both ends of the arc
  drawArrow(
    ctx,
    {
      x: startPoint.x + radius,
      y: startPoint.y,
    },
    Math.PI / 2,
    arrowSize
  );

  drawArrow(
    ctx,
    {
      x: startPoint.x + Math.cos(angle) * radius,
      y: startPoint.y + Math.sin(angle) * radius,
    },
    angle + Math.PI / 2,
    arrowSize
  );

  // Draw text (angle value)
  if (dimensionParams.showValue) {
    const angleDegrees = ((angle * 180) / Math.PI).toFixed(
      dimensionParams.precision
    );
    const displayText = `${angleDegrees}°`;

    // Position the text at the middle of the arc
    const midAngle = angle / 2;
    const textX = startPoint.x + Math.cos(midAngle) * radius;
    const textY = startPoint.y + Math.sin(midAngle) * radius;

    // Draw text
    ctx.save();
    ctx.font = `${dimensionParams.textHeight * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw a background for the text
    const textWidth = ctx.measureText(displayText).width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      textX - textWidth / 2 - 2,
      textY - (dimensionParams.textHeight * scale) / 2 - 2,
      textWidth + 4,
      dimensionParams.textHeight * scale + 4
    );

    // Draw the text
    ctx.fillStyle = isSelected ? '#0066ff' : '#000000';
    ctx.fillText(displayText, textX, textY);
    ctx.restore();
  }
};

/**
 * Draws a radius dimension
 */
const drawRadiusDimension = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  centerPoint: Point,
  radiusPoint: Point,
  dimensionParams: any,
  isSelected: boolean
) => {
  // For radius dimensions, we interpret:
  // startPoint as the center of the circle
  // endPoint as a point on the circle

  // Calculate the angle and distance (in unscaled coordinates)
  const dx = radiusPoint.x - centerPoint.x;
  const dy = radiusPoint.y - centerPoint.y;
  const angle = Math.atan2(dy, dx);

  // Calculate the actual radius value (unscaled) to display
  const actualRadius = Math.sqrt(dx * dx + dy * dy) / scale;

  // Set the radius value in dimensionParams (unscaled)
  dimensionParams.value = actualRadius;

  // Draw radius line
  ctx.beginPath();
  ctx.moveTo(centerPoint.x, centerPoint.y);
  ctx.lineTo(radiusPoint.x, radiusPoint.y);
  ctx.stroke();

  // Draw arrow at the endpoint
  drawArrow(
    ctx,
    radiusPoint,
    angle + Math.PI,
    dimensionParams.arrowSize * scale
  );

  // Draw text
  if (dimensionParams.showValue) {
    const formattedValue = dimensionParams.value.toFixed(
      dimensionParams.precision
    );
    const displayText = `R${formattedValue}${dimensionParams.units}`;

    // Position text
    const textX = centerPoint.x + dx * 0.6; // Position text at 60% of the radius
    const textY = centerPoint.y + dy * 0.6;

    // Draw text
    ctx.save();
    ctx.font = `${dimensionParams.textHeight * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw a background for the text
    const textWidth = ctx.measureText(displayText).width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      textX - textWidth / 2 - 2,
      textY - (dimensionParams.textHeight * scale) / 2 - 2,
      textWidth + 4,
      dimensionParams.textHeight * scale + 4
    );

    // Draw the text
    ctx.fillStyle = isSelected ? '#0066ff' : '#000000';
    ctx.fillText(displayText, textX, textY);
    ctx.restore();
  }
};

/**
 * Draws a diameter dimension
 */
const drawDiameterDimension = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  startPoint: Point,
  endPoint: Point,
  dimensionParams: any,
  isSelected: boolean
) => {
  // For diameter dimensions, we interpret:
  // startPoint and endPoint as points on opposite sides of the circle

  // Calculate the center point
  const centerX = (startPoint.x + endPoint.x) / 2;
  const centerY = (startPoint.y + endPoint.y) / 2;

  // Calculate angle and distance
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const angle = Math.atan2(dy, dx);

  // Calculate the actual diameter value (unscaled) to display
  const actualDiameter = Math.sqrt(dx * dx + dy * dy) / scale;

  // Set the diameter value in dimensionParams (unscaled)
  dimensionParams.value = actualDiameter;

  // Draw diameter line
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();

  // Draw arrows at both ends
  drawArrow(
    ctx,
    startPoint,
    angle + Math.PI,
    dimensionParams.arrowSize * scale
  );
  drawArrow(ctx, endPoint, angle, dimensionParams.arrowSize * scale);

  // Draw text
  if (dimensionParams.showValue) {
    const formattedValue = dimensionParams.value.toFixed(
      dimensionParams.precision
    );
    const displayText = `Ø${formattedValue}${dimensionParams.units}`;

    // Position text at center
    const textX = centerX;
    const textY = centerY;

    // Draw text
    ctx.save();
    ctx.font = `${dimensionParams.textHeight * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw a background for the text
    const textWidth = ctx.measureText(displayText).width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      textX - textWidth / 2 - 2,
      textY - (dimensionParams.textHeight * scale) / 2 - 2,
      textWidth + 4,
      dimensionParams.textHeight * scale + 4
    );

    // Draw the text
    ctx.fillStyle = isSelected ? '#0066ff' : '#000000';
    ctx.fillText(displayText, textX, textY);
    ctx.restore();
  }
};

/**
 * Draws extension line for dimensions
 */
const drawExtensionLine = (
  ctx: CanvasRenderingContext2D,
  startPoint: Point,
  endPoint: Point,
  offset: number
) => {
  // Calculate the vector from start to end
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Calculate the normalized direction vector
  const dirX = dx / length;
  const dirY = dy / length;

  // Calculate the offset point (starting point offset from shape)
  const offsetStartX = startPoint.x + dirX * offset;
  const offsetStartY = startPoint.y + dirY * offset;

  // Draw the extension line
  ctx.beginPath();
  ctx.moveTo(offsetStartX, offsetStartY);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();
};

/**
 * Draws arrow for dimensions
 */
const drawArrow = (
  ctx: CanvasRenderingContext2D,
  point: Point,
  angle: number,
  size: number
) => {
  const arrowAngle = Math.PI / 6; // 30 degrees

  // Calculate arrow points
  const x1 = point.x + size * Math.cos(angle + arrowAngle);
  const y1 = point.y + size * Math.sin(angle + arrowAngle);
  const x2 = point.x + size * Math.cos(angle - arrowAngle);
  const y2 = point.y + size * Math.sin(angle - arrowAngle);

  // Draw the arrow
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.fill();
};

/**
 * Draws a selection handle
 */
const drawHandle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  const handleSize = 6;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 1;

  ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(
    x - handleSize / 2,
    y - handleSize / 2,
    handleSize,
    handleSize
  );
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
