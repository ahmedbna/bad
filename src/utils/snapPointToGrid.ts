import { Point } from '@/types';

interface Props {
  point: Point;
  snapToGrid: boolean;
  gridSize: number;
}

// Snap point to grid if enabled
export const snapPointToGrid = ({ point, gridSize }: Props): Point => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
};
