import { Point } from '@/types';

// Arc drawing modes
export type ArcMode =
  | 'ThreePoint'
  | 'StartCenterEnd'
  | 'CenterStartEnd'
  | 'StartEndRadius'
  | 'StartEndDirection';

export type DrawingTool =
  | 'select'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'polyline'
  | 'arc'
  | 'ellipse'
  | 'polygon'
  | 'spline'
  | 'pan'
  | 'text'
  | 'dimension';

export type Command =
  | 'undo'
  | 'redo'
  | 'delete'
  | 'copy'
  | 'paste'
  | 'selectAll'
  | 'clear'
  | 'zoomIn'
  | 'zoomOut'
  | 'zoomFit'
  | 'move'
  | 'rotate'
  | 'offset'
  | 'stretch'
  | 'trim'
  | 'extend'
  | 'join'
  | 'erase'
  | 'chamfer'
  | 'fillet'
  | 'mirror';

// Constants for editing tools

export type EditingTool =
  | 'copy'
  | 'move'
  | 'rotate'
  | 'offset'
  | 'mirror'
  | 'stretch'
  | 'trim'
  | 'extend'
  | 'join'
  | 'chamfer'
  | 'fillet';

export type EditingState = {
  isActive: boolean;
  tool: EditingTool | null;
  basePoint: Point | null;
  selectedIds: string[];
  phase: 'select' | 'base' | 'target' | 'parameter';
  parameters: {
    angle?: number;
    distance?: number;
    radius?: number;
    length?: number;
  };
};

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
  stretch: {
    icon: 'Maximize',
    label: 'Stretch',
    shortcut: 'S',
    description: 'Stretch objects by moving points',
    phases: ['select', 'base', 'target'],
  },
  trim: {
    icon: 'Scissors',
    label: 'Trim',
    shortcut: 'TR',
    description: 'Trim objects at intersections',
    phases: ['select', 'target'],
  },
  extend: {
    icon: 'ArrowRight',
    label: 'Extend',
    shortcut: 'EX',
    description: 'Extend objects to meet other objects',
    phases: ['select', 'target'],
  },
  join: {
    icon: 'Combine',
    label: 'Join',
    shortcut: 'J',
    description: 'Join collinear lines or arcs',
    phases: ['select', 'select'],
  },
  chamfer: {
    icon: 'CornerDownRight',
    label: 'Chamfer',
    shortcut: 'CHA',
    description: 'Create beveled corners between lines',
    phases: ['parameter', 'parameter', 'select', 'select'],
  },
  fillet: {
    icon: 'CornerUpRight',
    label: 'Fillet',
    shortcut: 'F',
    description: 'Create rounded corners between lines',
    phases: ['parameter', 'select', 'select'],
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
      return phase === 'parameter'
        ? 'Specify first chamfer distance'
        : phase === 'parameter'
          ? 'Specify second chamfer distance'
          : phase === 'select'
            ? 'Select first line'
            : 'Select second line';

    case 'fillet':
      return phase === 'parameter'
        ? 'Specify fillet radius'
        : phase === 'select'
          ? 'Select first line'
          : 'Select second line';

    default:
      return '';
  }
}
