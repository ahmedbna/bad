import { WheelEvent } from 'react';
import { Point, ViewState } from '@/hooks/CADContext';

type WheelProps = {
  event: WheelEvent<HTMLCanvasElement>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewState: ViewState;
  screenToWorld: (point: Point) => Point;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
};

export const handleWheel = ({
  event,
  canvasRef,
  viewState,
  setViewState,
  screenToWorld,
}: WheelProps) => {
  event.preventDefault();

  // Get mouse position relative to canvas
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return;

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Calculate world position before zoom
  const worldPos = screenToWorld({ x: mouseX, y: mouseY });

  // Calculate zoom factor
  const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
  const newZoom = viewState.zoom * zoomFactor;

  // Limit zoom levels if needed
  const limitedZoom = Math.max(0.1, Math.min(10, newZoom));

  // Calculate new pan offset to keep point under mouse
  const newPanX = mouseX - worldPos.x * limitedZoom;
  const newPanY = mouseY - worldPos.y * limitedZoom;

  setViewState((prev) => ({
    ...prev,
    zoom: limitedZoom,
    panOffset: {
      x: newPanX,
      y: newPanY,
    },
  }));
};
