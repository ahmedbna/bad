import { Point } from '@/types';

// Constants for editing tools
export type EditingTool =
  | 'undo'
  | 'redo'
  | 'copy'
  | 'move'
  | 'rotate'
  | 'offset'
  | 'mirror';

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

export type EditingPhase = 'select' | 'base' | 'target' | 'parameter';

export const editingToolsData = {
  copy: {
    icon: 'Copy',
    label: 'Copy',
    shortcut: 'CP',
    description: 'Copy objects to a new location',
    phases: ['select', 'base', 'target'],
  },
  move: {
    icon: 'Move',
    label: 'Move',
    shortcut: 'M',
    description: 'Move objects to a new location',
    phases: ['select', 'base', 'target'],
  },
  rotate: {
    icon: 'RotateCcw',
    label: 'Rotate',
    shortcut: 'RO',
    description: 'Rotate objects around a base point',
    phases: ['select', 'base', 'target', 'parameter'],
  },
  offset: {
    icon: 'CopyPlus',
    label: 'Offset',
    shortcut: 'O',
    description: 'Create parallel copies of lines, arcs, and curves',
    phases: ['parameter', 'select', 'target'],
  },
  mirror: {
    icon: 'FlipHorizontal',
    label: 'Mirror',
    shortcut: 'MI',
    description: 'Create mirror copies of objects across a line',
    phases: ['select', 'base', 'target'],
  },
};

export const createInitialEditingState = (): EditingState => ({
  isActive: false,
  tool: null,
  basePoint: null,
  selectedIds: [],
  phase: 'select',
  parameters: {},
});

export function getEditingToolMessage(
  tool: EditingTool | null,
  phase: string
): string {
  if (!tool) return '';

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

    default:
      return '';
  }
}
