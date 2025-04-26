import { Point, ViewState } from '@/hooks/CADContext';

type CircleProps = {
  ctx: CanvasRenderingContext2D;
  entity: any;
  viewState: ViewState;
  worldToScreen: (point: Point) => Point;
};

export const drawCircle = ({
  ctx,
  entity,
  viewState,
  worldToScreen,
}: CircleProps) => {
  const centerPoint = worldToScreen(entity.center);
  const radius = entity.radius * viewState.zoom;

  ctx.beginPath();
  ctx.arc(centerPoint.x, centerPoint.y, radius, 0, Math.PI * 2);
  if (entity.properties?.fillColor) {
    ctx.fill();
  }
  ctx.stroke();
};
