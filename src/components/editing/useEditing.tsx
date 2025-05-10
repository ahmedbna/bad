import { useState, useEffect, useCallback } from 'react';
import { Point, Shape } from '@/types';
import {
  EditingState,
  EditingTool,
  createInitialEditingState,
  editingToolsData,
} from './constants';
import { executeEditingOperation } from '@/components/editing/editing-operations';

export function useEditing(
  shapes: Shape[],
  setShapes: (shapes: Shape[]) => void,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  scale: number,
  offset: { x: number; y: number },
  selectedShapesIds: string[]
) {
  // State for managing the current editing operation
  const [editingState, setEditingState] = useState<EditingState>(
    createInitialEditingState()
  );
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (x: number, y: number): Point => {
      if (!canvasRef.current) return { x: 0, y: 0 };

      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: (x - rect.left - offset.x) / scale,
        y: (y - rect.top - offset.y) / scale,
      };
    },
    [canvasRef, scale, offset]
  );

  // Handle canvas click during editing
  const handleEditingClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editingState.isActive || !editingState.tool) return;

      const point = screenToCanvas(e.clientX, e.clientY);

      switch (editingState.phase) {
        case 'select':
          // Handle selection phase
          const slectedShapes = shapes.map((shape) =>
            selectedShapesIds.includes(shape.id)
          );

          if (slectedShapes) {
            const newSelectedIds = [
              ...editingState.selectedIds,
              slectedShapes.id,
            ];

            const toolData = editingToolsData[editingState.tool];
            const currentPhaseIndex = toolData.phases.indexOf('select');
            const nextPhase =
              toolData.phases[currentPhaseIndex + 1] || 'select';

            // If this is the last selection needed, move to next phase
            if (
              (editingState.tool === 'join' && newSelectedIds.length === 2) ||
              (editingState.tool === 'chamfer' &&
                newSelectedIds.length === 2) ||
              (editingState.tool === 'fillet' && newSelectedIds.length === 2) ||
              (['trim', 'extend'].includes(editingState.tool) &&
                editingState.selectedIds.length > 0) ||
              !['join', 'chamfer', 'fillet', 'trim', 'extend'].includes(
                editingState.tool
              )
            ) {
              setEditingState({
                ...editingState,
                selectedIds: newSelectedIds,
                phase: nextPhase,
              });
            } else {
              // Still in selection phase
              setEditingState({
                ...editingState,
                selectedIds: newSelectedIds,
              });
            }

            // Special case for trim/extend/join operations that need to execute after selections
            if (
              (editingState.tool === 'join' && newSelectedIds.length === 2) ||
              (editingState.tool === 'chamfer' &&
                newSelectedIds.length === 2 &&
                editingState.parameters.distance1 &&
                editingState.parameters.distance2) ||
              (editingState.tool === 'fillet' &&
                newSelectedIds.length === 2 &&
                editingState.parameters.radius)
            ) {
              executeOperation();
            }
          }
          break;

        case 'base':
          // Set base point for operations like move, copy, rotate
          setEditingState({
            ...editingState,
            basePoint: point,
            phase:
              editingToolsData[editingState.tool].phases[
                editingToolsData[editingState.tool].phases.indexOf('base') + 1
              ],
          });
          break;

        case 'target':
          // Set target point and execute the operation
          if (editingState.tool === 'offset') {
            const side = point.x > editingState.basePoint?.x ? 'right' : 'left';
            executeOperation(point, undefined, { side });
          } else if (
            editingState.tool === 'trim' ||
            editingState.tool === 'extend'
          ) {
            executeOperation(point);
          } else {
            executeOperation(undefined, point);
          }
          break;

        default:
          break;
      }
    },
    [editingState, shapes, screenToCanvas]
  );

  // Execute the current editing operation
  const executeOperation = useCallback(
    (targetPoint?: Point, secondaryPoint?: Point, additionalParams?: any) => {
      if (!editingState.isActive || !editingState.tool) return;

      const newShapes = executeEditingOperation(
        editingState.tool,
        shapes,
        editingState.selectedIds,
        {
          ...editingState.parameters,
          ...additionalParams,
        },
        editingState.basePoint || undefined,
        targetPoint,
        secondaryPoint
      );

      setShapes(newShapes);

      // Reset to initial state after operation
      setEditingState(createInitialEditingState());
    },
    [editingState, shapes, setShapes]
  );

  // Update status message based on current editing state
  useEffect(() => {
    if (!editingState.isActive || !editingState.tool) {
      setStatusMessage('');
      return;
    }

    const message = getEditingToolMessage(
      editingState.tool,
      editingState.phase
    );
    setStatusMessage(message);
  }, [editingState]);

  // Handle keyboard shortcuts for editing operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Escape to cancel current operation
      if (e.key === 'Escape' && editingState.isActive) {
        setEditingState(createInitialEditingState());
        return;
      }

      // Only process shortcuts when not in an active operation
      if (editingState.isActive) return;

      // Handle shortcuts for editing tools
      const shortcuts: Record<string, EditingTool> = {
        cp: 'copy',
        m: 'move',
        ro: 'rotate',
        o: 'offset',
        mi: 'mirror',
        s: 'stretch',
        tr: 'trim',
        ex: 'extend',
        j: 'join',
        cha: 'chamfer',
        f: 'fillet',
      };

      // Keep track of typed characters for multi-character shortcuts
      if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        const typed = e.key.toLowerCase();

        // Check for single character shortcuts
        if (shortcuts[typed]) {
          setEditingState({
            isActive: true,
            tool: shortcuts[typed],
            basePoint: null,
            selectedIds: [],
            phase: editingToolsData[shortcuts[typed]].phases[0],
            parameters: {},
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingState]);

  return {
    editingState,
    setEditingState,
    statusMessage,
    handleEditingClick,
    executeOperation,
  };
}
