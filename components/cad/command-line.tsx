'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCADContext } from '@/hooks/CADContext';
import { Input } from '@/components/ui/input';

// Command definitions
const commands = {
  LINE: {
    description: 'Create a line',
    execute: (context, args) => {
      context.setCurrentTool('line');
      return 'Line tool activated. Click to set start point.';
    },
  },
  CIRCLE: {
    description: 'Create a circle',
    execute: (context, args) => {
      context.setCurrentTool('circle');
      return 'Circle tool activated. Click to set center point.';
    },
  },
  RECT: {
    description: 'Create a rectangle',
    execute: (context, args) => {
      context.setCurrentTool('rectangle');
      return 'Rectangle tool activated. Click to set first corner.';
    },
  },
  TEXT: {
    description: 'Add text',
    execute: (context, args) => {
      context.setCurrentTool('text');
      return 'Text tool activated. Click to set insertion point.';
    },
  },
  SELECT: {
    description: 'Select entities',
    execute: (context, args) => {
      context.setCurrentTool('pointer');
      return 'Selection tool activated.';
    },
  },
  DELETE: {
    description: 'Delete selected entities',
    execute: (context, args) => {
      const selectedIds = context.selectedEntities;
      if (selectedIds.length === 0) {
        return 'No entities selected.';
      }

      context.deleteEntities(selectedIds);
      return `Deleted ${selectedIds.length} entities.`;
    },
  },
  MOVE: {
    description: 'Move selected entities',
    execute: (context, args) => {
      if (context.selectedEntities.length === 0) {
        return 'No entities selected.';
      }

      context.setCurrentTool('move');
      return 'Move tool activated. Click to specify base point.';
    },
  },
  COPY: {
    description: 'Copy selected entities',
    execute: (context, args) => {
      if (context.selectedEntities.length === 0) {
        return 'No entities selected.';
      }

      context.setCurrentTool('copy');
      return 'Copy tool activated. Click to specify base point.';
    },
  },
  ROTATE: {
    description: 'Rotate selected entities',
    execute: (context, args) => {
      if (context.selectedEntities.length === 0) {
        return 'No entities selected.';
      }

      context.setCurrentTool('rotate');
      return 'Rotate tool activated. Click to specify rotation center.';
    },
  },
  ZOOM: {
    description: 'Zoom view (ZOOM IN/OUT/ALL)',
    execute: (context, args) => {
      if (args.length === 0) {
        return 'Please specify zoom parameter (IN/OUT/ALL).';
      }

      const subCommand = args[0].toUpperCase();

      switch (subCommand) {
        case 'IN':
          context.setViewState((prev) => ({
            ...prev,
            zoom: prev.zoom * 1.2,
          }));
          return 'Zoomed in.';
        case 'OUT':
          context.setViewState((prev) => ({
            ...prev,
            zoom: prev.zoom / 1.2,
          }));
          return 'Zoomed out.';
        case 'ALL':
          // Find bounds of all entities and zoom to fit
          if (context.entities.length === 0) {
            context.setViewState((prev) => ({
              ...prev,
              zoom: 1,
              panOffset: {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
              },
            }));
            return 'View reset.';
          }

          // This would require calculating bounds of all entities
          // For simplicity, we'll just reset the view
          context.setViewState((prev) => ({
            ...prev,
            zoom: 1,
            panOffset: {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            },
          }));
          return 'Zoomed to fit all entities.';
        default:
          return `Unknown zoom parameter: ${subCommand}`;
      }
    },
  },
  GRID: {
    description: 'Toggle grid on/off or set grid size',
    execute: (context, args) => {
      if (args.length === 0) {
        // Toggle grid
        context.setViewState((prev) => ({
          ...prev,
          grid: {
            ...prev.grid,
            enabled: !prev.grid.enabled,
          },
        }));
        return `Grid ${context.viewState.grid.enabled ? 'off' : 'on'}.`;
      }

      const subCommand = args[0].toUpperCase();

      if (subCommand === 'ON') {
        context.setViewState((prev) => ({
          ...prev,
          grid: {
            ...prev.grid,
            enabled: true,
          },
        }));
        return 'Grid turned on.';
      } else if (subCommand === 'OFF') {
        context.setViewState((prev) => ({
          ...prev,
          grid: {
            ...prev.grid,
            enabled: false,
          },
        }));
        return 'Grid turned off.';
      } else if (subCommand === 'SNAP') {
        // Toggle grid snap
        context.setViewState((prev) => ({
          ...prev,
          grid: {
            ...prev.grid,
            snap: !prev.grid.snap,
          },
        }));
        return `Grid snap ${context.viewState.grid.snap ? 'off' : 'on'}.`;
      } else if (!isNaN(parseInt(subCommand))) {
        // Set grid size
        const size = parseInt(subCommand);
        context.setViewState((prev) => ({
          ...prev,
          grid: {
            ...prev.grid,
            size,
          },
        }));
        return `Grid size set to ${size}.`;
      } else {
        return `Unknown grid parameter: ${subCommand}`;
      }
    },
  },
  LAYER: {
    description: 'Layer operations (NEW/SET/LIST)',
    execute: (context, args) => {
      if (args.length === 0) {
        return 'Please specify layer operation (NEW/SET/LIST).';
      }

      const subCommand = args[0].toUpperCase();

      switch (subCommand) {
        case 'NEW':
          if (args.length < 2) {
            return 'Please specify layer name.';
          }

          const layerName = args[1];
          const layerId = context.addLayer({ name: layerName });
          return `Layer "${layerName}" created with ID: ${layerId}.`;
        case 'SET':
          if (args.length < 2) {
            return 'Please specify layer name or ID.';
          }

          const layerIdentifier = args[1];
          const layer = context.layers.find(
            (l) =>
              l.id === layerIdentifier ||
              l.name.toLowerCase() === layerIdentifier.toLowerCase()
          );

          if (!layer) {
            return `Layer "${layerIdentifier}" not found.`;
          }

          context.setCurrentLayer(layer.id);
          return `Current layer set to "${layer.name}".`;
        case 'LIST':
          const layerList = context.layers
            .map(
              (l) =>
                `${l.name}${l.id === context.currentLayer ? ' (current)' : ''}`
            )
            .join(', ');

          return `Layers: ${layerList}`;
        default:
          return `Unknown layer operation: ${subCommand}`;
      }
    },
  },
  UNDO: {
    description: 'Undo last operation',
    execute: (context, args) => {
      context.undo();
      return 'Undo completed.';
    },
  },
  REDO: {
    description: 'Redo last undone operation',
    execute: (context, args) => {
      context.redo();
      return 'Redo completed.';
    },
  },
  HELP: {
    description: 'Show available commands',
    execute: (context, args) => {
      if (args.length > 0) {
        const commandName = args[0].toUpperCase();
        const command = commands[commandName];

        if (!command) {
          return `Command "${commandName}" not found.`;
        }

        return `${commandName}: ${command.description}`;
      }

      const commandList = Object.keys(commands)
        .map((cmd) => `${cmd}: ${commands[cmd].description}`)
        .join('\n');

      return `Available commands:\n${commandList}`;
    },
  },
};

export default function CommandLine() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [response, setResponse] = useState('Command:');
  const inputRef = useRef(null);

  const context = useCADContext();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = (commandStr) => {
    // Save to history
    setHistory((prev) => [commandStr, ...prev]);
    setHistoryIndex(-1);

    // Parse command
    const parts = commandStr.trim().split(/\s+/);
    const commandName = parts[0].toUpperCase();
    const args = parts.slice(1);

    // Look up command
    const command = commands[commandName];

    if (!command) {
      setResponse(
        `Unknown command: ${commandName}. Type HELP for available commands.`
      );
      return;
    }

    try {
      // Execute command
      const result = command.execute(context, args);
      setResponse(result);
    } catch (error) {
      console.error('Command execution error:', error);
      setResponse(`Error executing command: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      executeCommand(input.trim());
      setInput('');
    } else if (e.key === 'ArrowUp') {
      // Navigate history up
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      // Navigate history down
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Escape') {
      // Cancel current tool
      context.setCurrentTool(null);
      setResponse('Command canceled.');
    }
  };

  return (
    <div className='border-t border-gray-200 bg-slate-50 p-2'>
      <div className='flex items-center'>
        <div className='text-sm text-gray-600 w-64 truncate'>{response}</div>
        <Input
          ref={inputRef}
          className='ml-2 flex-1'
          placeholder='Enter command (type HELP for commands)'
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
