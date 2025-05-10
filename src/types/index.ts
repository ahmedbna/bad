import { DrawingTool } from '../constants';

export type Point = { x: number; y: number };

export type Shape = {
  id: string;
  points: Point[];
  type: DrawingTool;
  properties: ShapeProperties;
};

export interface ShapeProperties {
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
  sides?: number;
  startAngle?: number;
  endAngle?: number;
  isFullEllipse?: boolean;
  tension?: number;
  isCompleted?: boolean;
  isClockwise?: boolean;
  width?: number;
  height?: number;
  length?: number;
  isClosed?: boolean;
  controlPoints?: Point[];
  degree?: number;
  knots?: number[];
  weights?: number[];
  angle?: number;
  perimeter?: number;
  area?: number;
  diagonal?: number;
  diameter?: number;
  circumference?: number;
  sideLength?: number;
  internalAngle?: number;
  arcLength?: number;
  chordLength?: number;
  innerRadius?: number;
  center?: Point;
  textParams?: TextParams;
  dimensionParams?: DimensionParams;
}

export interface TextParams {
  content: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  rotation: number;
  justification: 'left' | 'center' | 'right';
}

export interface DimensionParams {
  dimensionType: 'linear' | 'angular' | 'radius' | 'diameter';
  offset: number;
  extensionLineOffset: number;
  arrowSize: number;
  textHeight: number;
  precision: number;
  units: string;
  showValue: boolean;
  textRotation: number;
  value: number;
  textPosition?: Point;
}

export type PolarSettings = {
  enabled: boolean;
  angleIncrement: number;
  angles: number[];
  snapThreshold: number;
  trackingLines: boolean;
};
