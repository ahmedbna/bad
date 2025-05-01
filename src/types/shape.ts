import { DrawingTool } from './drawing-tool';
import { Point } from './point';

export type Shape = {
  id: string;
  type: DrawingTool;
  points: Point[];
  properties?: {
    radius?: number;
    width?: number;
    height?: number;
    length?: number;
  };
};
