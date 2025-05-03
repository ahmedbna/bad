export type Property = {
  length: string;
  width: string;
  height: string;
  radius: string;
  diameter: string;
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
}
