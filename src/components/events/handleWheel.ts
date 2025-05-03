import { Point } from '@/types/point';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { worldToCanvas } from '@/utils/worldToCanvas';

type Props = {
  e: React.WheelEvent<HTMLCanvasElement>;
  scale: number;
  offset: Point;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setOffset: React.Dispatch<React.SetStateAction<Point>>;
};

// Handle mouse wheel for zooming
export const handleWheel = ({
  e,
  scale,
  offset,
  setScale,
  setOffset,
}: Props) => {
  e.preventDefault();

  // Smoother zoom factor
  const zoomIntensity = 0.05;
  const direction = e.deltaY > 0 ? -1 : 1;
  const zoomFactor = 1 + direction * zoomIntensity;

  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Get world position under cursor before zoom
  const worldPointBeforeZoom = canvasToWorld({
    point: { x: mouseX, y: mouseY },
    scale,
    offset,
  });

  // New scale
  const newScale = scale * zoomFactor;
  setScale(newScale);

  // Get screen position of same world point after zoom
  const newScreenPoint = worldToCanvas({
    point: worldPointBeforeZoom,
    scale: newScale,
    offset,
  });

  // Adjust offset so zoom centers around the cursor
  setOffset((prev) => ({
    x: prev.x + (mouseX - newScreenPoint.x),
    y: prev.y + (mouseY - newScreenPoint.y),
  }));
};
