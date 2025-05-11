// Update the render-editing.ts file to enhance editing mode visuals

export const renderEditingVisuals = (
  ctx: CanvasRenderingContext2D,
  editingState: EditingState,
  scale: number,
  offset: { x: number; y: number }
) => {
  if (!editingState.isActive) return;

  // Early exit if no tool is active
  if (!editingState.tool) return;

  // Add a semi-transparent overlay to indicate editing mode
  const canvas = ctx.canvas;
  ctx.save();
  ctx.restore();

  // Set styles for editing visuals
  ctx.strokeStyle = '#2563eb'; // Blue color for editing mode
  ctx.lineWidth = 1 / scale;
  ctx.setLineDash([5 / scale, 5 / scale]);

  // Render base point if exists
  if (
    editingState.basePoint &&
    editingState.basePoint.x !== null &&
    editingState.basePoint.y !== null
  ) {
    // Draw a more visible base point marker
    ctx.beginPath();
    ctx.arc(
      editingState.basePoint.x,
      editingState.basePoint.y,
      5 / scale,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Fill the base point with a semi-transparent color
    ctx.fillStyle = 'rgba(37, 99, 235, 0.3)';
    ctx.fill();

    // Draw crosshair at base point
    ctx.beginPath();
    ctx.moveTo(editingState.basePoint.x - 10 / scale, editingState.basePoint.y);
    ctx.lineTo(editingState.basePoint.x + 10 / scale, editingState.basePoint.y);
    ctx.moveTo(editingState.basePoint.x, editingState.basePoint.y - 10 / scale);
    ctx.lineTo(editingState.basePoint.x, editingState.basePoint.y + 10 / scale);
    ctx.stroke();

    // Add a label for the base point
    ctx.font = `${12 / scale}px sans-serif`;
    ctx.fillStyle = '#2563eb';
    ctx.fillText(
      'Base Point',
      editingState.basePoint.x + 12 / scale,
      editingState.basePoint.y - 12 / scale
    );
  }

  // Render rotation angle visualization
  if (
    editingState.tool === 'rotate' &&
    editingState.basePoint &&
    editingState.parameters.angle !== undefined
  ) {
    const angle = editingState.parameters.angle * (Math.PI / 180);
    const radius = 30 / scale;

    // Draw a circular arc showing the rotation angle
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

    // Add angle text with background for better visibility
    const angleText = `${Math.round(editingState.parameters.angle)}°`;
    const textX =
      editingState.basePoint.x + Math.cos(angle / 2) * (radius + 10 / scale);
    const textY =
      editingState.basePoint.y + Math.sin(angle / 2) * (radius + 10 / scale);

    // Draw text background
    ctx.font = `${12 / scale}px sans-serif`;
    const textWidth = ctx.measureText(angleText).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(
      textX - 2 / scale,
      textY - 12 / scale,
      textWidth + 4 / scale,
      14 / scale
    );

    // Draw text
    ctx.fillStyle = '#2563eb';
    ctx.fillText(angleText, textX, textY);
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
      const offsetText = `Offset: ${editingState.parameters.distance}`;
      ctx.font = `${12 / scale}px sans-serif`;

      // Draw text background
      const textWidth = ctx.measureText(offsetText).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(
        editingState.basePoint.x + 10 / scale,
        editingState.basePoint.y + 10 / scale - 12 / scale,
        textWidth + 4 / scale,
        14 / scale
      );

      // Draw text
      ctx.fillStyle = '#2563eb';
      ctx.fillText(
        offsetText,
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
    // Draw a more prominent mirror line
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

    // Add a label for mirror line
    ctx.font = `${12 / scale}px sans-serif`;
    ctx.fillStyle = '#2563eb';
    ctx.fillText(
      'Mirror Line',
      editingState.basePoint.x + 5 / scale,
      editingState.basePoint.y - 15 / scale
    );

    // // Add mirror reflection preview if the second point exists
    // if (editingState.secondPoint) {
    //   // Draw the second point
    //   ctx.beginPath();
    //   ctx.arc(
    //     editingState.secondPoint.x,
    //     editingState.secondPoint.y,
    //     4 / scale,
    //     0,
    //     Math.PI * 2
    //   );
    //   ctx.fillStyle = 'rgba(37, 99, 235, 0.3)';
    //   ctx.fill();
    //   ctx.stroke();

    //   // Draw line from base point to second point
    //   ctx.beginPath();
    //   ctx.setLineDash([3 / scale, 3 / scale]);
    //   ctx.moveTo(editingState.basePoint.x, editingState.basePoint.y);
    //   ctx.lineTo(editingState.secondPoint.x, editingState.secondPoint.y);
    //   ctx.stroke();

    //   // Reset line dash
    //   ctx.setLineDash([5 / scale, 5 / scale]);
    // }
  }

  // Render copy visualization
  if (
    editingState.tool === 'copy' &&
    editingState.basePoint &&
    editingState.phase === 'target'
  ) {
    const distance = editingState.parameters.distance || 50;
    const radius = 40 / scale;

    // Draw source point
    ctx.beginPath();
    ctx.setLineDash([2 / scale, 2 / scale]);
    ctx.arc(
      editingState.basePoint.x,
      editingState.basePoint.y,
      radius / 2,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Draw destination point (assuming a horizontal copy for visualization)
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(
      editingState.basePoint.x + distance / scale,
      editingState.basePoint.y,
      radius / 2,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Draw connecting line with arrow
    ctx.beginPath();
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.moveTo(editingState.basePoint.x, editingState.basePoint.y);
    ctx.lineTo(
      editingState.basePoint.x + distance / scale,
      editingState.basePoint.y
    );
    ctx.stroke();

    // Reset line dash
    ctx.setLineDash([]);

    // Draw arrow at the end
    const arrowSize = 10 / scale;
    ctx.beginPath();
    ctx.moveTo(
      editingState.basePoint.x + distance / scale,
      editingState.basePoint.y
    );
    ctx.lineTo(
      editingState.basePoint.x + distance / scale - arrowSize,
      editingState.basePoint.y - arrowSize / 2
    );
    ctx.lineTo(
      editingState.basePoint.x + distance / scale - arrowSize,
      editingState.basePoint.y + arrowSize / 2
    );
    ctx.closePath();
    ctx.fillStyle = '#2563eb';
    ctx.fill();

    // Add copy text
    const copyText = `Copy: ${distance.toFixed(2)}`;
    ctx.font = `${12 / scale}px sans-serif`;

    // Draw text background
    const textWidth = ctx.measureText(copyText).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(
      editingState.basePoint.x + distance / 2 / scale - textWidth / 2,
      editingState.basePoint.y - 20 / scale,
      textWidth + 4 / scale,
      14 / scale
    );

    // Draw text
    ctx.fillStyle = '#2563eb';
    ctx.fillText(
      copyText,
      editingState.basePoint.x +
        distance / 2 / scale -
        textWidth / 2 +
        2 / scale,
      editingState.basePoint.y - 20 / scale + 11 / scale
    );

    // Reset line dash
    ctx.setLineDash([5 / scale, 5 / scale]);
  }

  // Selection visualization
  if (editingState.phase === 'select' && editingState.selectedIds.length > 0) {
    // Here we would normally loop through selected elements and highlight them
    // Since we don't have access to the actual elements, we'll just show a message

    // Draw a selection indicator at the top of the screen
    const selectionText = `${editingState.selectedIds.length} item(s) selected`;
    ctx.font = `${14 / scale}px sans-serif`;

    // Draw text background
    const textWidth = ctx.measureText(selectionText).width;
    const padding = 8 / scale;

    ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
    ctx.fillRect(
      canvas.width / 2 - textWidth / 2 - padding,
      10 / scale,
      textWidth + padding * 2,
      20 / scale
    );

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(
      canvas.width / 2 - textWidth / 2 - padding,
      10 / scale,
      textWidth + padding * 2,
      20 / scale
    );

    // Draw text
    ctx.fillStyle = '#2563eb';
    ctx.fillText(selectionText, canvas.width / 2 - textWidth / 2, 24 / scale);
  }

  // Render move visualization - similar to offset but with selected elements
  if (
    editingState.tool === 'move' &&
    editingState.basePoint &&
    editingState.phase === 'target'
  ) {
    // Draw movement vector
    const movementDistance = editingState.parameters.distance || 0;
    const angle = editingState.parameters.angle || 0;
    const radians = angle * (Math.PI / 180);

    // Calculate target point based on distance and angle
    const targetX =
      editingState.basePoint.x + (Math.cos(radians) * movementDistance) / scale;
    const targetY =
      editingState.basePoint.y + (Math.sin(radians) * movementDistance) / scale;

    // Draw connecting line with arrow
    ctx.beginPath();
    ctx.setLineDash([3 / scale, 3 / scale]);
    ctx.moveTo(editingState.basePoint.x, editingState.basePoint.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Reset line dash
    ctx.setLineDash([]);

    // Draw arrow at the end
    const arrowSize = 10 / scale;
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(
      targetX - arrowSize * Math.cos(radians - Math.PI / 6),
      targetY - arrowSize * Math.sin(radians - Math.PI / 6)
    );
    ctx.lineTo(
      targetX - arrowSize * Math.cos(radians + Math.PI / 6),
      targetY - arrowSize * Math.sin(radians + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = '#2563eb';
    ctx.fill();

    // Add distance text
    const moveText = `Move: ${movementDistance.toFixed(2)} @ ${angle.toFixed(1)}°`;
    ctx.font = `${12 / scale}px sans-serif`;

    // Calculate middle point for text
    const midX = (editingState.basePoint.x + targetX) / 2;
    const midY = (editingState.basePoint.y + targetY) / 2 - 10 / scale;

    // Draw text background
    const textWidth = ctx.measureText(moveText).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(
      midX - textWidth / 2 - 2 / scale,
      midY - 12 / scale,
      textWidth + 4 / scale,
      14 / scale
    );

    // Draw text
    ctx.fillStyle = '#2563eb';
    ctx.fillText(moveText, midX - textWidth / 2, midY);

    // Reset line dash
    ctx.setLineDash([5 / scale, 5 / scale]);
  }

  // Display current editing mode and phase at the bottom of the screen
  const toolNames = {
    copy: 'Copy',
    move: 'Move',
    rotate: 'Rotate',
    offset: 'Offset',
    mirror: 'Mirror',
  };

  const phaseNames = {
    select: 'Select objects',
    base: 'Pick base point',
    target: 'Pick target point',
    parameter: 'Enter parameter value',
  };

  // Display editing status at the bottom of the canvas
  if (editingState.isActive && editingState.tool) {
    const statusText = `${toolNames[editingState.tool]} - ${phaseNames[editingState.phase]}`;
    ctx.font = `${14 / scale}px sans-serif`;

    // Draw text background
    const textWidth = ctx.measureText(statusText).width;
    const padding = 12 / scale;
    const statusbarHeight = 24 / scale;

    ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
    ctx.fillRect(
      canvas.width / 2 - textWidth / 2 - padding,
      canvas.height - statusbarHeight - 10 / scale,
      textWidth + padding * 2,
      statusbarHeight
    );

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(
      canvas.width / 2 - textWidth / 2 - padding,
      canvas.height - statusbarHeight - 10 / scale,
      textWidth + padding * 2,
      statusbarHeight
    );

    // Draw text
    ctx.fillStyle = '#2563eb';
    ctx.fillText(
      statusText,
      canvas.width / 2 - textWidth / 2,
      canvas.height - 20 / scale
    );
  }

  // Display any additional parameter input hints
  if (editingState.isActive && editingState.phase === 'parameter') {
    let paramHint = '';

    if (editingState.tool === 'rotate') {
      paramHint = `Enter rotation angle: ${editingState.parameters.angle || 0}°`;
    } else if (editingState.tool === 'offset') {
      paramHint = `Enter offset distance: ${editingState.parameters.distance || 0}`;
    } else if (editingState.tool === 'copy') {
      paramHint = `Enter copy distance: ${editingState.parameters.distance || 0}`;
    }

    if (paramHint) {
      ctx.font = `${12 / scale}px sans-serif`;

      // Draw text background
      const textWidth = ctx.measureText(paramHint).width;
      const padding = 8 / scale;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        canvas.width / 2 - textWidth / 2 - padding,
        canvas.height - 50 / scale,
        textWidth + padding * 2,
        20 / scale
      );

      // Draw text
      ctx.fillStyle = '#2563eb';
      ctx.fillText(
        paramHint,
        canvas.width / 2 - textWidth / 2,
        canvas.height - 36 / scale
      );
    }
  }

  // Reset line dash when done with all editing visuals
  ctx.setLineDash([]);
};

// Constants for editing tools
export type EditingTool = 'copy' | 'move' | 'rotate' | 'offset' | 'mirror';
export type EditingPhase = 'select' | 'base' | 'target' | 'parameter';

export type EditingState = {
  isActive: boolean;
  tool: EditingTool | null;
  basePoint: Point | null;
  selectedIds: string[];
  phase: EditingPhase;
  parameters: {
    angle?: number;
    distance?: number;
    radius?: number;
    length?: number;
    distance1?: number;
    distance2?: number;
    side?: 'left' | 'right';
  };
};

interface Point {
  x: number;
  y: number;
}
