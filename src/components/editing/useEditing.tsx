'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Point, Shape } from '@/types';
import {
  EditingPhase,
  EditingState,
  EditingTool,
  createInitialEditingState,
  editingToolsData,
  getEditingToolMessage,
} from './constants';
import { executeEditingOperation } from './editing-operations';
import { worldToCanvas } from '@/utils/worldToCanvas';

export function useEditing(
  shapes: Shape[],
  setShapes: (shapes: Shape[]) => void,
  scale: number,
  offset: { x: number; y: number },
  selectedShapesIds: string[]
) {
  // State for managing the current editing operation
  const [editingState, setEditingState] = useState<EditingState>(
    createInitialEditingState() as EditingState
  );
  const [statusMessage, setStatusMessage] = useState<string>('');

  // To track multi-key commands like AutoCAD
  const keyBuffer = useRef<string>('');
  const keyBufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // History for undo/redo functionality
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Add shape changes to history
  const addToHistory = useCallback(
    (newShapes: Shape[]) => {
      // Only add if different from current state
      if (JSON.stringify(newShapes) !== JSON.stringify(shapes)) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...newShapes]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    },
    [history, historyIndex, shapes]
  );

  // Handle undo operation
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
    }
  }, [history, historyIndex, setShapes]);

  // Handle redo operation
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
    }
  }, [history, historyIndex, setShapes]);

  // Initial history setup
  useEffect(() => {
    if (history.length === 0 && shapes.length > 0) {
      setHistory([[...shapes]]);
      setHistoryIndex(0);
    }
  }, [shapes, history]);

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
          // Use the selectedShapesIds provided from the parent component
          if (selectedShapesIds.length > 0) {
            const newSelectedIds = [...selectedShapesIds];
            const toolData =
              editingToolsData[
                editingState.tool as keyof typeof editingToolsData
              ];

            if (!toolData) return;

            const currentPhaseIndex = toolData.phases.indexOf('select');
            const nextPhase =
              currentPhaseIndex >= 0 &&
              currentPhaseIndex < toolData.phases.length - 1
                ? toolData.phases[currentPhaseIndex + 1]
                : 'select';

            // Update state based on the tool requirements
            setEditingState((prev: EditingState) => ({
              ...prev,
              selectedIds: newSelectedIds,
              phase: nextPhase as EditingPhase,
              // For tools like offset that need a base point
              basePoint: ['offset'].includes(editingState.tool as string)
                ? point
                : prev.basePoint,
            }));
          }
          break;

        case 'base':
          // Set base point for operations like move, copy, rotate
          const nextPhaseAfterBase =
            editingToolsData[editingState.tool as keyof typeof editingToolsData]
              ?.phases?.[
              editingToolsData[
                editingState.tool as keyof typeof editingToolsData
              ]?.phases?.indexOf('base') + 1
            ] || 'target';

          setEditingState({
            ...editingState,
            basePoint: point,
            phase: nextPhaseAfterBase as 'target',
          });
          break;

        case 'target':
          // Set target point and execute the operation
          if (editingState.tool === 'offset') {
            const side =
              point.x > (editingState.basePoint?.x || 0) ? 'right' : 'left';
            executeOperation(point, undefined, { side });
          } else {
            // Tools like move, copy, rotate need the target point
            executeOperation(undefined, point);
          }
          break;

        case 'parameter':
          // In a real implementation, this would typically use a numeric input dialog
          // For now, we'll use mouse position as a simplification
          if (editingState.tool === 'rotate') {
            // Calculate angle based on basePoint and current point
            if (editingState.basePoint) {
              const dx = point.x - editingState.basePoint.x;
              const dy = point.y - editingState.basePoint.y;
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              setEditingState((prev) => ({
                ...prev,
                parameters: {
                  ...prev.parameters,
                  angle,
                },
                phase: 'target',
              }));
            }
          } else {
            // For other parameter-based tools, move to next phase
            const nextPhaseAfterParameter =
              editingToolsData[
                editingState.tool as keyof typeof editingToolsData
              ]?.phases?.[
                editingToolsData[
                  editingState.tool as keyof typeof editingToolsData
                ]?.phases?.indexOf('parameter') + 1
              ] || 'select';

            setEditingState((prev) => ({
              ...prev,
              phase: nextPhaseAfterParameter as EditingPhase,
            }));
          }
          break;

        default:
          break;
      }
    },
    [editingState, selectedShapesIds, scale, offset]
  );

  // Execute the current editing operation
  const executeOperation = useCallback(
    (targetPoint?: Point, secondaryPoint?: Point, additionalParams?: any) => {
      if (!editingState.isActive || !editingState.tool) return;

      // Save current state to history before executing operation
      addToHistory([...shapes]);

      const newShapes = executeEditingOperation(
        editingState.tool as any,
        shapes,
        editingState.selectedIds.length > 0
          ? editingState.selectedIds
          : selectedShapesIds,
        {
          ...editingState.parameters,
          ...additionalParams,
        },
        editingState.basePoint || undefined,
        targetPoint,
        secondaryPoint
      );

      setShapes(newShapes);

      // Keep tool active for continuous operations (AutoCAD-like behavior)
      // This allows for multiple edits with the same tool
      if (['copy', 'move', 'offset'].includes(editingState.tool)) {
        // Reset phase but keep the tool active
        const initialPhase =
          editingToolsData[editingState.tool as keyof typeof editingToolsData]
            ?.phases?.[0] || 'select';
        setEditingState((prev) => ({
          ...prev,
          selectedIds: [],
          basePoint: null,
          phase: initialPhase as EditingPhase,
          parameters: {}, // Reset parameters for next operation
        }));
      } else {
        // For other tools, reset to initial state after operation
        setEditingState(createInitialEditingState() as EditingState);
      }
    },
    [editingState, shapes, setShapes, selectedShapesIds, addToHistory]
  );

  // Set the editing tool
  const setEditingTool = useCallback(
    (tool: EditingTool | null) => {
      if (!tool) {
        setEditingState(createInitialEditingState() as EditingState);
        return;
      }

      // Use type assertion to help TypeScript understand that the tool is a valid key
      const toolData = editingToolsData[tool as keyof typeof editingToolsData];
      if (!toolData) return;

      // Special handling for undo/redo
      if (tool === 'undo') {
        handleUndo();
        return;
      } else if (tool === 'redo') {
        handleRedo();
        return;
      }

      // Handle parameter input for tools that need initial parameters
      if (toolData.phases[0] === 'parameter') {
        // For real implementation, prompt user for parameter values
        // Here we'll set defaults for demonstration
        let initialParameters: EditingState['parameters'] = {};

        if (tool === 'offset') {
          initialParameters = { distance: 10 };
        }

        setEditingState({
          isActive: true,
          tool,
          basePoint: null,
          selectedIds: [],
          phase: toolData.phases[0],
          parameters: initialParameters,
        } as EditingState);
      } else {
        // Standard tool activation
        setEditingState({
          isActive: true,
          tool,
          basePoint: null,
          selectedIds: [],
          phase: toolData.phases[0],
          parameters: {},
        } as EditingState);
      }
    },
    [handleUndo, handleRedo]
  );

  // Update parameter for current editing operation
  const updateParameter = useCallback((paramName: string, value: number) => {
    setEditingState((prevState: EditingState) => {
      // Check if we need to move to the next phase
      const currentTool = prevState.tool;
      if (!currentTool) return prevState;

      const toolData =
        editingToolsData[currentTool as keyof typeof editingToolsData];
      if (!toolData) return prevState;

      let nextPhase = prevState.phase;

      return {
        ...prevState,
        phase: nextPhase,
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

  // Handle keyboard shortcuts for editing operations - AutoCAD style command line
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape to cancel current operation
      if (e.key === 'Escape' && editingState.isActive) {
        setEditingState(createInitialEditingState() as EditingState);
        keyBuffer.current = '';
        return;
      }

      // Handle command combinations (Ctrl+Z for undo, Ctrl+Y for redo)
      if (e.ctrlKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
          return;
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Only process shortcuts when not in an active operation
      // or when the operation is waiting for parameter input
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
        // This is similar to AutoCAD's command line behavior
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
  }, [
    editingState.isActive,
    editingState.phase,
    setEditingTool,
    handleUndo,
    handleRedo,
  ]);

  // Provides numeric input handling (similar to AutoCAD's command line)
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

  return {
    editingState,
    setEditingState,
    setEditingTool,
    updateParameter,
    statusMessage,
    handleEditingClick,
    executeOperation,
    handleNumericInput,
    commandBuffer: keyBuffer.current, // Expose the command buffer for UI
    handleUndo,
    handleRedo,
  };
}
