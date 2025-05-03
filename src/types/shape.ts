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
    startAngle?: number;
    endAngle?: number;
    sides?: number;
    isFullEllipse?: boolean;
    radiusX?: number;
    radiusY?: number;
    isClosed?: boolean;
    // For splines
    controlPoints?: Point[];
    degree?: number;
    knots?: number[];
    weights?: number[];

    rotation?: number;
    tension?: number;

    isClockwise?: boolean;
  };
  isCompleted?: boolean;
};
