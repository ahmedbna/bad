import { Point } from '@/types/point';

type Props = {
  point: Point;
  scale: number;
  offset: Point;
};

// Convert screen coordinates to world coordinates
export const screenToWorld = ({ point, scale, offset }: Props): Point => {
  return {
    x: (point.x - offset.x) / scale,
    y: (point.y - offset.y) / scale,
  };
};
