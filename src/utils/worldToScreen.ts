import { Point } from '@/types/point';

type Props = {
  point: Point;
  scale: number;
  offset: Point;
};

// Convert world coordinates to screen coordinates
export const worldToScreen = ({ point, scale, offset }: Props): Point => {
  return {
    x: point.x * scale + offset.x,
    y: point.y * scale + offset.y,
  };
};
