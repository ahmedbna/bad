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
