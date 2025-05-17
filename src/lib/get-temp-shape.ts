import { Point } from '@/types';
import { Id } from '@/convex/_generated/dataModel';
import { DrawingTool } from '@/constants';

type Props = {
  type: DrawingTool;
  points: Point[];
  properties?: any;
};

export const getTempShape = ({ points, type, properties = {} }: Props) => {
  return {
    type,
    points,
    properties,
    _id: `temp-shape-${Date.now()}` as Id<'shapes'>,
    _creationTime: Date.now(),
    projectId: 'temp-project' as Id<'projects'>,
    userId: 'temp-user' as Id<'users'>,
    layerId: 'temp-layer' as Id<'layers'>,
    layer: {
      _id: 'temp-layer' as Id<'layers'>,
      _creationTime: Date.now(),
      projectId: 'temp-project' as Id<'projects'>,
      name: 'temp-layer',
      isVisible: true,
      isLocked: false,
      isDefault: true,
      color: '#000000',
      lineType: 'solid',
      lineWidth: 1,
    },
  };
};
