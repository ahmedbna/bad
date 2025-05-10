'use client';

import React, { useState } from 'react';
import {
  Copy,
  Move,
  RotateCcw,
  CopyPlus,
  FlipHorizontal,
  Maximize,
  Scissors,
  ArrowRight,
  Combine,
  CornerDownRight,
  CornerUpRight,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { EditingTool, EditingState, EditingPhase } from './constants';

// Import from editingToolsData from constants
const editingToolsData = {
  copy: {
    icon: Copy,
    label: 'Copy',
    shortcut: 'CP',
    description: 'Copy objects to a new location',
    phases: ['select', 'base', 'target'],
  },
  move: {
    icon: Move,
    label: 'Move',
    shortcut: 'M',
    description: 'Move objects to a new location',
    phases: ['select', 'base', 'target'],
  },
  rotate: {
    icon: RotateCcw,
    label: 'Rotate',
    shortcut: 'RO',
    description: 'Rotate objects around a base point',
    phases: ['select', 'base', 'target', 'parameter'],
  },
  offset: {
    icon: CopyPlus,
    label: 'Offset',
    shortcut: 'O',
    description: 'Create parallel copies of lines, arcs, and curves',
    phases: ['parameter', 'select', 'target'],
  },
  mirror: {
    icon: FlipHorizontal,
    label: 'Mirror',
    shortcut: 'MI',
    description: 'Create mirror copies of objects across a line',
    phases: ['select', 'base', 'target'],
  },
  stretch: {
    icon: Maximize,
    label: 'Stretch',
    shortcut: 'S',
    description: 'Stretch objects by moving points',
    phases: ['select', 'base', 'target'],
  },
  trim: {
    icon: Scissors,
    label: 'Trim',
    shortcut: 'TR',
    description: 'Trim objects at intersections',
    phases: ['select', 'target'],
  },
  extend: {
    icon: ArrowRight,
    label: 'Extend',
    shortcut: 'EX',
    description: 'Extend objects to meet other objects',
    phases: ['select', 'target'],
  },
  join: {
    icon: Combine,
    label: 'Join',
    shortcut: 'J',
    description: 'Join collinear lines or arcs',
    phases: ['select', 'select'],
  },
  chamfer: {
    icon: CornerDownRight,
    label: 'Chamfer',
    shortcut: 'CHA',
    description: 'Create beveled corners between lines',
    phases: ['parameter', 'parameter', 'select', 'select'],
  },
  fillet: {
    icon: CornerUpRight,
    label: 'Fillet',
    shortcut: 'F',
    description: 'Create rounded corners between lines',
    phases: ['parameter', 'select', 'select'],
  },
};

type Props = {
  editingState: EditingState;
  setEditingState: (state: EditingState) => void;
};

export const EditingToolbar = ({ editingState, setEditingState }: Props) => {
  const [showToolbar, setShowToolbar] = useState(true);

  const handleToolClick = (tool: EditingTool) => {
    setEditingState({
      isActive: true,
      tool,
      basePoint: null,
      selectedIds: [],
      phase: editingToolsData[tool].phases[0] as EditingPhase,
      parameters: {},
    });
  };

  const handleCancel = () => {
    setEditingState({
      isActive: false,
      tool: null,
      basePoint: null,
      selectedIds: [],
      phase: 'select',
      parameters: {},
    });
  };

  const handleParameterChange = (param, value) => {
    setEditingState({
      ...editingState,
      parameters: {
        ...editingState.parameters,
        [param]: parseFloat(value) || 0,
      },
    });
  };

  const getStatusMessage = () => {
    if (!editingState.isActive || !editingState.tool)
      return 'Select an editing tool to begin';

    const tool = editingState.tool;
    const phase = editingState.phase;

    switch (tool) {
      case 'copy':
        return phase === 'select'
          ? 'Select objects to copy'
          : phase === 'base'
            ? 'Specify base point'
            : 'Specify target point';

      case 'move':
        return phase === 'select'
          ? 'Select objects to move'
          : phase === 'base'
            ? 'Specify base point'
            : 'Specify target point';

      case 'rotate':
        return phase === 'select'
          ? 'Select objects to rotate'
          : phase === 'base'
            ? 'Specify base point'
            : phase === 'parameter'
              ? 'Specify rotation angle'
              : 'Specify target point';

      case 'offset':
        return phase === 'parameter'
          ? 'Specify offset distance'
          : phase === 'select'
            ? 'Select object to offset'
            : 'Specify side to offset';

      case 'mirror':
        return phase === 'select'
          ? 'Select objects to mirror'
          : phase === 'base'
            ? 'Specify first point of mirror line'
            : 'Specify second point of mirror line';

      case 'stretch':
        return phase === 'select'
          ? 'Select objects to stretch using a crossing window'
          : phase === 'base'
            ? 'Specify base point'
            : 'Specify target point';

      case 'trim':
        return phase === 'select'
          ? 'Select cutting edges'
          : 'Select objects to trim';

      case 'extend':
        return phase === 'select'
          ? 'Select boundary edges'
          : 'Select objects to extend';

      case 'join':
        return phase === 'select'
          ? 'Select first object'
          : 'Select second object to join';

      case 'chamfer':
        if (phase === 'parameter' && !editingState.parameters.distance1) {
          return 'Specify first chamfer distance';
        } else if (
          phase === 'parameter' &&
          !editingState.parameters.distance2
        ) {
          return 'Specify second chamfer distance';
        } else if (editingState.selectedIds.length === 0) {
          return 'Select first line';
        } else {
          return 'Select second line';
        }

      case 'fillet':
        return phase === 'parameter'
          ? 'Specify fillet radius'
          : editingState.selectedIds.length === 0
            ? 'Select first line'
            : 'Select second line';

      default:
        return 'Select an operation';
    }
  };

  const renderParameterInputs = () => {
    if (!editingState.isActive || !editingState.tool) return null;

    const tool = editingState.tool;

    switch (tool) {
      case 'rotate':
        if (editingState.phase === 'parameter') {
          return (
            <div className='flex items-center gap-2'>
              <label className='text-sm'>Angle (degrees):</label>
              <Input
                type='number'
                className='w-24'
                value={editingState.parameters.angle || ''}
                onChange={(e) => handleParameterChange('angle', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingState({
                      ...editingState,
                      phase: 'target',
                    });
                  }
                }}
              />
            </div>
          );
        }
        return null;

      case 'offset':
        if (editingState.phase === 'parameter') {
          return (
            <div className='flex items-center gap-2'>
              <label className='text-sm'>Distance:</label>
              <Input
                type='number'
                className='w-24'
                value={editingState.parameters.distance || ''}
                onChange={(e) =>
                  handleParameterChange('distance', e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingState({
                      ...editingState,
                      phase: 'select',
                    });
                  }
                }}
              />
            </div>
          );
        }
        return null;

      case 'chamfer':
        if (editingState.phase === 'parameter') {
          if (!editingState.parameters.distance1) {
            return (
              <div className='flex items-center gap-2'>
                <label className='text-sm'>First distance:</label>
                <Input
                  type='number'
                  className='w-24'
                  value={editingState.parameters.distance1 || ''}
                  onChange={(e) =>
                    handleParameterChange('distance1', e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingState({
                        ...editingState,
                        parameters: {
                          ...editingState.parameters,
                          distance1: parseFloat(e.target.value) || 0,
                        },
                      });
                    }
                  }}
                />
              </div>
            );
          } else {
            return (
              <div className='flex items-center gap-2'>
                <label className='text-sm'>Second distance:</label>
                <Input
                  type='number'
                  className='w-24'
                  value={editingState.parameters.distance2 || ''}
                  onChange={(e) =>
                    handleParameterChange('distance2', e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingState({
                        ...editingState,
                        phase: 'select',
                      });
                    }
                  }}
                />
              </div>
            );
          }
        }
        return null;

      case 'fillet':
        if (editingState.phase === 'parameter') {
          return (
            <div className='flex items-center gap-2'>
              <label className='text-sm'>Radius:</label>
              <Input
                type='number'
                className='w-24'
                value={editingState.parameters.radius || ''}
                onChange={(e) =>
                  handleParameterChange('radius', e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingState({
                      ...editingState,
                      phase: 'select',
                    });
                  }
                }}
              />
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className='flex flex-col w-full'>
      <div className=' p-2 rounded-t-md flex items-center justify-between'>
        <h3 className='text-sm font-medium'>Editing Tools</h3>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setShowToolbar(!showToolbar)}
          className='h-6 w-6 p-0'
        >
          {showToolbar ? '-' : '+'}
        </Button>
      </div>

      {showToolbar && (
        <>
          <div className=' border p-2 flex flex-wrap gap-1'>
            <TooltipProvider>
              {Object.entries(editingToolsData).map(([key, data]) => {
                const Icon = data.icon;
                const isActive = editingState.tool === key;

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'default' : 'outline'}
                        size='sm'
                        className='p-2 h-8 w-8'
                        onClick={() => handleToolClick(key as EditingTool)}
                      >
                        <Icon className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {data.label} ({data.shortcut})
                      </p>
                      <p className='text-xs text-gray-500'>
                        {data.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          <div className='border-x border-b p-3 rounded-b-md'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium'>{getStatusMessage()}</p>
                {renderParameterInputs()}
              </div>

              {editingState.isActive && (
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleCancel}
                  className='h-7'
                >
                  <XCircle className='h-4 w-4 mr-1' /> Cancel
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
