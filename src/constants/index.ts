import { Id } from '@/convex/_generated/dataModel';
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

export const getTempShape = (points: Point[]) => {
  return {
    _id: `temp-${Date.now()}` as Id<'shapes'>,
    _creationTime: Date.now(),
    layerId: `temp-pro-${Date.now()}` as Id<'layers'>,
    projectId: `temp-pro-${Date.now()}` as Id<'projects'>,
    userId: `temp-usr-${Date.now()}` as Id<'users'>,
    type: 'arc',
    points: points,
    properties: { isCompleted: false },
    layer: {
      _id: `temp-layer-${Date.now()}` as Id<'layers'>,
      _creationTime: Date.now(),
      projectId: `temp-pro-${Date.now()}` as Id<'projects'>,
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
