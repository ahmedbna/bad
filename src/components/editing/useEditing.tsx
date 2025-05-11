'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Point } from '@/types';
import {
  EditingPhase,
  EditingState,
  EditingTool,
  createInitialEditingState,
  getEditingToolMessage,
} from './constants';
import { executeEditingOperation } from './editing-operations';
import { worldToCanvas } from '@/utils/worldToCanvas';
import { editingToolsData } from './editing-toolbar';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useEditing(
  scale: number,
  offset: Point,
  shapes: Array<Doc<'shapes'>>,
  selectedShapeIds: Id<'shapes'>[]
) {
  const createShape = useMutation(api.shapes.create);
  const updateShape = useMutation(api.shapes.update);

  // State for managing the current editing operation
  const [editingState, setEditingState] = useState<EditingState>(
    createInitialEditingState()
  );
  const [statusMessage, setStatusMessage] = useState<string>('');

  // To track multi-key commands like AutoCAD
  const keyBuffer = useRef<string>('');
  const keyBufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Execute the current editing operation
  const executeOperation = useCallback(
    async (
      targetPoint?: Point,
      secondaryPoint?: Point,
      additionalParams?: any
    ) => {
      if (!editingState.isActive || !editingState.tool) return;

      // Determine which IDs to use - either from editing state or selected shapes
      const idsToUse =
        editingState.selectedIds.length > 0
          ? editingState.selectedIds
          : selectedShapeIds;

      if (idsToUse.length === 0) return;

      // Get the selected shapes from the shapes array
      const selectedShapes = shapes.filter((shape) =>
        idsToUse.includes(shape._id)
      );
      if (selectedShapes.length === 0) return;

      // Execute the operation (simulation - this now returns operations to perform)
      const operationResult = executeEditingOperation(
        editingState.tool,
        selectedShapes,
        idsToUse,
        {
          ...editingState.parameters,
          ...additionalParams,
        },
        editingState.basePoint || undefined,
        targetPoint
      );

      // Apply the changes to Convex database
      try {
        // Find which shapes need to be created, updated, or deleted
        const existingShapeIds = new Set(shapes.map((s) => s._id));
        const projectId = selectedShapes[0].projectId; // Get project ID from selected shapes

        // Process new shapes (not in original shapes array)
        const newShapes = operationResult.filter(
          (shape) => !('_id' in shape) || !existingShapeIds.has(shape._id)
        );

        // For operations that create new shapes (copy, mirror, offset)
        if (newShapes.length > 0) {
          // Create each new shape in Convex
          for (const shape of newShapes) {
            await createShape({
              projectId,
              type: shape.type,
              points: shape.points,
              properties: shape.properties,
            });
          }
        }

        // For operations that modify existing shapes (move, rotate)
        const updatedShapes = operationResult.filter(
          (shape) => '_id' in shape && existingShapeIds.has(shape._id)
        );

        for (const shape of updatedShapes) {
          await updateShape({
            shapeId: shape._id,
            points: shape.points,
            properties: shape.properties,
          });
        }
      } catch (error) {
        console.error('Error applying editing operation:', error);
      }

      // Reset to initial state after operation
      setEditingState(createInitialEditingState());
    },
    [editingState, shapes, selectedShapeIds, createShape, updateShape]
  );

  // Handle canvas click during editing
  const handleEditingClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editingState.isActive || !editingState.tool) return;

      const point = worldToCanvas({
        point: { x: e.clientX, y: e.clientY },
        scale,
        offset,
      });

      switch (editingState.phase) {
        case 'select':
          // Check if shapes are already selected (from before activating the tool)
          if (selectedShapeIds.length > 0) {
            // Use the existing selections and move to the next phase
            const toolData = editingToolsData[editingState.tool];
            if (!toolData) return;

            // For offset tool, only one shape can be selected at a time
            if (editingState.tool === 'offset' && selectedShapeIds.length > 1) {
              setStatusMessage('Please select only one object for offset');
              return;
            }

            const currentPhaseIndex = toolData.phases.indexOf('select');
            const nextPhase =
              currentPhaseIndex >= 0 &&
              currentPhaseIndex < toolData.phases.length - 1
                ? toolData.phases[currentPhaseIndex + 1]
                : 'select';

            // Update state to move to the next phase with already selected shapes
            setEditingState((prev) => ({
              ...prev,
              selectedIds: selectedShapeIds,
              phase: nextPhase as EditingPhase,
            }));
          } else {
            // Keep in selection phase until user selects objects
            return;
          }
          break;

        case 'base':
          // Set base point for operations like move, copy, rotate, mirror
          const toolData = editingToolsData[editingState.tool];
          if (!toolData) return;

          const nextPhaseAfterBase =
            toolData.phases[toolData.phases.indexOf('base') + 1] || 'target';

          setEditingState({
            ...editingState,
            basePoint: point,
            phase: nextPhaseAfterBase as EditingPhase,
          });
          break;

        case 'target':
          // Execute the operation with the target point
          if (editingState.tool === 'offset') {
            // For offset, determine which side to offset to
            const side =
              point.x > (editingState.basePoint?.x || 0) ? 'right' : 'left';
            executeOperation(point, undefined, { side });
          } else if (editingState.tool === 'mirror') {
            // For mirror, we need two points to define the mirror line
            executeOperation(point);
          } else {
            // For move, copy, rotate - just need the target point
            executeOperation(point);
          }
          break;

        case 'parameter':
          // In parameter phase, we need to collect specific parameters
          if (editingState.tool === 'rotate') {
            // Calculate angle based on basePoint and current point
            if (editingState.basePoint) {
              const dx = point.x - editingState.basePoint.x;
              const dy = point.y - editingState.basePoint.y;
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              setEditingState({
                ...editingState,
                parameters: {
                  ...editingState.parameters,
                  angle,
                },
                phase: 'target',
              });
            }
          }
          break;

        default:
          break;
      }
    },
    [
      editingState,
      selectedShapeIds,
      scale,
      offset,
      executeOperation,
      setStatusMessage,
    ]
  );

  // Set the editing tool
  const setEditingTool = useCallback(
    (tool: EditingTool | null) => {
      if (!tool) {
        setEditingState(createInitialEditingState());
        return;
      }

      const toolData = editingToolsData[tool];
      if (!toolData) return;

      // Check if shapes are already selected before activating tool
      const hasExistingSelection = selectedShapeIds.length > 0;

      // Handle parameter input for tools that need initial parameters
      if (toolData.phases[0] === 'parameter') {
        // Set default parameters for tools that need them upfront
        let initialParameters = {};

        if (tool === 'offset') {
          initialParameters = { distance: 10 };
        } else if (tool === 'rotate') {
          initialParameters = { angle: 90 };
        }

        setEditingState({
          isActive: true,
          tool,
          basePoint: null,
          selectedIds: hasExistingSelection ? selectedShapeIds : [],
          phase: toolData.phases[0] as EditingPhase,
          parameters: initialParameters,
        });
      } else {
        // Standard tool activation
        // If there are already selected shapes, we might want to skip the select phase
        const startPhase =
          hasExistingSelection && toolData.phases.includes('select')
            ? toolData.phases[toolData.phases.indexOf('select') + 1]
            : toolData.phases[0];

        setEditingState({
          isActive: true,
          tool,
          basePoint: null,
          selectedIds: hasExistingSelection ? selectedShapeIds : [],
          phase: hasExistingSelection
            ? (startPhase as EditingPhase)
            : (toolData.phases[0] as EditingPhase),
          parameters: {},
        });
      }
    },
    [selectedShapeIds]
  );

  // Update parameter for current editing operation
  const updateParameter = useCallback((paramName: string, value: number) => {
    setEditingState((prevState) => {
      const currentTool = prevState.tool;
      if (!currentTool) return prevState;

      const toolData = editingToolsData[currentTool];
      if (!toolData) return prevState;

      // Find next phase after parameter input
      const currentPhaseIndex = toolData.phases.indexOf('parameter');
      const nextPhase =
        currentPhaseIndex >= 0 && currentPhaseIndex < toolData.phases.length - 1
          ? toolData.phases[currentPhaseIndex + 1]
          : prevState.phase;

      return {
        ...prevState,
        phase: nextPhase as EditingPhase,
        parameters: {
          ...prevState.parameters,
          [paramName]: value,
        },
      };
    });
  }, []);

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
  }, [editingState.isActive, editingState.tool, editingState.phase]);

  // Handle keyboard shortcuts for editing operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape to cancel current operation
      if (e.key === 'Escape' && editingState.isActive) {
        setEditingState(createInitialEditingState());
        keyBuffer.current = '';
        return;
      }

      // Handle common shortcuts
      if (e.ctrlKey) {
        if (e.key === 'c' && !editingState.isActive) {
          e.preventDefault();
          setEditingTool('copy');
          return;
        } else if (e.key === 'm' && !editingState.isActive) {
          e.preventDefault();
          setEditingTool('move');
          return;
        } else if (e.key === 'r' && !editingState.isActive) {
          e.preventDefault();
          setEditingTool('rotate');
          return;
        }
      }

      // Only process command input when not in an active operation
      if (editingState.isActive && editingState.phase !== 'parameter') return;

      // Track typed keys for AutoCAD-like command input
      if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
        // Clear any pending timeout
        if (keyBufferTimeoutRef.current) {
          clearTimeout(keyBufferTimeoutRef.current);
        }

        // Add key to buffer
        keyBuffer.current += e.key.toLowerCase();

        // Check for shortcut matches
        const matchedTool = Object.entries(editingToolsData).find(
          ([_, data]) => data.shortcut?.toLowerCase() === keyBuffer.current
        );

        if (matchedTool) {
          const tool = matchedTool[0] as EditingTool;
          setEditingTool(tool);
          keyBuffer.current = '';
        } else {
          // Set timeout to clear buffer after 1 second
          keyBufferTimeoutRef.current = setTimeout(() => {
            keyBuffer.current = '';
          }, 1000);
        }
      } else if (e.key === 'Enter' && keyBuffer.current) {
        // Enter key should execute the current command if any
        const matchedTool = Object.entries(editingToolsData).find(
          ([tool, _]) => tool.toLowerCase() === keyBuffer.current
        );

        if (matchedTool) {
          const tool = matchedTool[0] as EditingTool;
          setEditingTool(tool);
        }

        keyBuffer.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (keyBufferTimeoutRef.current) {
        clearTimeout(keyBufferTimeoutRef.current);
      }
    };
  }, [editingState.isActive, editingState.phase, setEditingTool]);

  // Handle numeric input for parameters
  const handleNumericInput = useCallback(
    (value: number) => {
      if (!editingState.isActive || !editingState.tool) return;

      if (editingState.phase === 'parameter') {
        switch (editingState.tool) {
          case 'rotate':
            updateParameter('angle', value);
            break;
          case 'offset':
            updateParameter('distance', value);
            break;
          default:
            break;
        }
      }
    },
    [editingState, updateParameter]
  );

  // Placeholder functions for undo/redo - these would need to be implemented differently
  // in a server-based architecture
  const handleUndo = useCallback(() => {
    console.log('Undo functionality needs server implementation');
  }, []);

  const handleRedo = useCallback(() => {
    console.log('Redo functionality needs server implementation');
  }, []);

  return {
    editingState,
    setEditingState,
    setEditingTool,
    updateParameter,
    statusMessage,
    handleEditingClick,
    executeOperation,
    handleNumericInput,
    commandBuffer: keyBuffer.current,
    handleUndo,
    handleRedo,
  };
}
