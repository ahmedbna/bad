import { Id } from '@/convex/_generated/dataModel';
import { Point } from '@/types';

// Constants for editing tools
export type EditingTool = 'copy' | 'move' | 'rotate' | 'offset' | 'mirror';
export type EditingPhase = 'select' | 'base' | 'target' | 'parameter';

export type EditingState = {
  isActive: boolean;
  tool: EditingTool | null;
  basePoint: Point | null;
  selectedIds: Id<'shapes'>[];
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
