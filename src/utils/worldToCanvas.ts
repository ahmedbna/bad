import { Point } from '@/types';

type Props = {
  point: Point;
  scale: number;
  offset: Point;
};

/**
 * Convert world coordinates to canvas coordinates
 * This is needed when drawing shapes on the canvas
 */
export const worldToCanvas = ({ point, scale, offset }: Props): Point => {
  return {
    x: point.x * scale + offset.x,
    y: -point.y * scale + offset.y, // Note the negative sign to flip Y axis
  };
};
