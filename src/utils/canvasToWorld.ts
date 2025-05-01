import { Point } from '@/types/point';

type Props = {
  point: Point;
  offset: Point;
  scale: number;
};

/**
 * Convert canvas coordinates to world coordinates
 * This is needed when handling mouse events to get correct world position
 */
export const canvasToWorld = ({ point, offset, scale }: Props): Point => {
  return {
    x: (point.x - offset.x) / scale,
    y: -(point.y - offset.y) / scale, // Note the negative sign to flip Y axis
  };
};
