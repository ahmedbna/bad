import { Shape } from '@/types';
import { EditingState } from './constants';

// Inside your renderCanvas function or similar
export const renderEditingVisuals = (
  ctx: CanvasRenderingContext2D,
  editingState: EditingState,
  scale: number,
  offset: { x: number; y: number }
) => {
  if (!editingState.isActive) return;

  // Set styles for editing visuals
  ctx.strokeStyle = '#2563eb'; // Blue color for editing mode
  ctx.lineWidth = 1 / scale;
  ctx.setLineDash([5 / scale, 5 / scale]);

  // Render base point if exists
  if (editingState.basePoint) {
    ctx.beginPath();
    ctx.arc(
      editingState.basePoint.x,
      editingState.basePoint.y,
      5 / scale,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Draw crosshair at base point
    ctx.beginPath();
    ctx.moveTo(editingState.basePoint.x - 10 / scale, editingState.basePoint.y);
    ctx.lineTo(editingState.basePoint.x + 10 / scale, editingState.basePoint.y);
    ctx.moveTo(editingState.basePoint.x, editingState.basePoint.y - 10 / scale);
    ctx.lineTo(editingState.basePoint.x, editingState.basePoint.y + 10 / scale);
    ctx.stroke();
  }

  // Render rotation angle visualization
  if (
    editingState.tool === 'rotate' &&
    editingState.basePoint &&
    editingState.parameters.angle !== undefined
  ) {
    const angle = editingState.parameters.angle * (Math.PI / 180);
    const radius = 30 / scale;

    ctx.beginPath();
    ctx.arc(
      editingState.basePoint.x,
      editingState.basePoint.y,
      radius,
      0,
      angle,
      angle < 0
    );
    ctx.stroke();

    // Draw line from center to angle
    ctx.beginPath();
    ctx.moveTo(editingState.basePoint.x, editingState.basePoint.y);
    ctx.lineTo(
      editingState.basePoint.x + Math.cos(angle) * radius,
      editingState.basePoint.y + Math.sin(angle) * radius
    );
    ctx.stroke();

    // Add angle text
    ctx.font = `${12 / scale}px sans-serif`;
    ctx.fillStyle = '#2563eb';
    ctx.fillText(
      `${Math.round(editingState.parameters.angle)}°`,
      editingState.basePoint.x + Math.cos(angle / 2) * (radius + 10 / scale),
      editingState.basePoint.y + Math.sin(angle / 2) * (radius + 10 / scale)
    );
  }

  // Render offset distance visualization
  if (
    editingState.tool === 'offset' &&
    editingState.parameters.distance !== undefined
  ) {
    // This would be more complex and depends on your specific implementation
    // We'd need to show a parallel line at the given distance
    // For this example, we'll just show the distance value
    if (editingState.basePoint) {
      ctx.font = `${12 / scale}px sans-serif`;
      ctx.fillStyle = '#2563eb';
      ctx.fillText(
        `Offset: ${editingState.parameters.distance}`,
        editingState.basePoint.x + 10 / scale,
        editingState.basePoint.y + 10 / scale
      );
    }
  }

  // Render mirror line visualization
  if (
    editingState.tool === 'mirror' &&
    editingState.basePoint &&
    editingState.phase === 'target'
  ) {
    // In a real implementation we'd draw a temporary mirror line
    // and possibly a preview of the mirrored objects
    ctx.beginPath();
    ctx.moveTo(
      editingState.basePoint.x,
      editingState.basePoint.y - 1000 / scale
    );
    ctx.lineTo(
      editingState.basePoint.x,
      editingState.basePoint.y + 1000 / scale
    );
    ctx.stroke();
  }

  // Reset line dash for other rendering
  ctx.setLineDash([]);
};

// Then call this function in your main rendering logic:
// renderEditingVisuals(ctx, editingState, scale, offset);

// Update your shape rendering logic to highlight shapes differently in editing mode

// Inside your renderShape function or similar
const renderShape = (
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  scale: number,
  isSelected: boolean,
  editingState: EditingState
) => {
  // Set styles based on selection and editing state
  const isEditingSelected =
    editingState.isActive && editingState.selectedIds.includes(shape.id);

  // Default style
  ctx.strokeStyle = shape.strokeColor || '#000';
  ctx.fillStyle = shape.fillColor || 'rgba(0, 0, 0, 0)';
  ctx.lineWidth = (shape.strokeWidth || 1) / scale;

  // Regular selection style
  if (isSelected && !editingState.isActive) {
    ctx.strokeStyle = '#2563eb'; // Blue for regular selection
    ctx.lineWidth = ((shape.strokeWidth || 1) * 1.5) / scale;
  }

  // Editing selection style - different for different editing operations
  if (isEditingSelected) {
    switch (editingState.tool) {
      case 'move':
      case 'copy':
        ctx.strokeStyle = '#9333ea'; // Purple for move/copy
        ctx.lineWidth = ((shape.strokeWidth || 1) * 1.5) / scale;
        break;
      case 'rotate':
        ctx.strokeStyle = '#ea580c'; // Orange for rotate
        ctx.lineWidth = ((shape.strokeWidth || 1) * 1.5) / scale;
        break;
      case 'mirror':
        ctx.strokeStyle = '#16a34a'; // Green for mirror
        ctx.lineWidth = ((shape.strokeWidth || 1) * 1.5) / scale;
        break;
      case 'trim':
      case 'extend':
        ctx.strokeStyle = '#dc2626'; // Red for trim/extend
        ctx.lineWidth = ((shape.strokeWidth || 1) * 1.5) / scale;
        break;
      default:
        ctx.strokeStyle = '#2563eb'; // Default blue
        ctx.lineWidth = ((shape.strokeWidth || 1) * 1.5) / scale;
    }
  }

  // Render the shape based on its type
  // Your existing rendering logic for different shape types...

  // Add selection handles for selected shapes
  if ((isSelected || isEditingSelected) && editingState.phase !== 'target') {
    renderSelectionHandles(ctx, shape, scale, isEditingSelected);
  }

  // Render preview during target phase if the shape is selected for editing
  if (
    isEditingSelected &&
    editingState.phase === 'target' &&
    editingState.basePoint &&
    ['move', 'copy', 'rotate', 'stretch'].includes(editingState.tool || '')
  ) {
    // Create a temporary preview at cursor position for move/copy
    // This is simplified - actual implementation would depend on mouse position
    ctx.save();
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.strokeStyle = '#9333ea80'; // Semi-transparent purple

    // Your preview rendering logic would depend on the specific tool
    // and the current mouse position...

    ctx.restore();
  }
};

// Helper function to render selection handles
const renderSelectionHandles = (
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  scale: number,
  isEditingSelected: boolean
) => {
  // Get shape bounds - implementation depends on your shape structure
  const bounds = getShapeBounds(shape);

  // Draw selection rectangle around the shape
  ctx.save();
  ctx.strokeStyle = isEditingSelected ? '#9333ea' : '#2563eb';
  ctx.setLineDash([5 / scale, 5 / scale]);
  ctx.lineWidth = 1 / scale;
  ctx.strokeRect(
    bounds.x - 5 / scale,
    bounds.y - 5 / scale,
    bounds.width + 10 / scale,
    bounds.height + 10 / scale
  );

  // Draw handles at corners and midpoints
  ctx.fillStyle = isEditingSelected ? '#9333ea' : '#2563eb';
  const handlePoints = [
    // Corners
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
    // Midpoints
    { x: bounds.x + bounds.width / 2, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height / 2 },
  ];

  handlePoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3 / scale, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
};

// Helper function to calculate shape bounds
const getShapeBounds = (shape: Shape) => {
  // This would need to be implemented based on your shape types
  // Example for a line:
  if (shape.type === 'line') {
    const x = Math.min(shape.points[0].x, shape.points[1].x);
    const y = Math.min(shape.points[0].y, shape.points[1].y);
    const width = Math.abs(shape.points[1].x - shape.points[0].x);
    const height = Math.abs(shape.points[1].y - shape.points[0].y);
    return { x, y, width, height };
  }

  // Similar implementations for other shape types...

  // Default fallback
  return { x: 0, y: 0, width: 0, height: 0 };
};
