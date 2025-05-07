import { DrawingTool } from '../constants';

export type Point = { x: number; y: number };

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

    textParams?: TextParams;
    dimensionParams?: DimensionParams;
  };
  isCompleted?: boolean;
};

export type Property = {
  length: string;
  width: string;
  height: string;
  radius: string;
  diameter: string;
  direction: string;
  radiusX: string;
  radiusY: string;
  startAngle: string;
  endAngle: string;
  sides: string;
  rotation: string;
  tension: string;
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
  completeShape?: boolean;
  isClockwise?: boolean;
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
