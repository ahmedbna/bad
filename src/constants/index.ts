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
