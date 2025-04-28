import { Point, ViewState } from '@/hooks/CADContext';

type RectangleProps = {
  ctx: CanvasRenderingContext2D;
  entity: any;
  viewState: ViewState;
  worldToScreen: (point: Point) => Point;
};

export const drawRectangle = ({
  ctx,
  entity,
  viewState,
  worldToScreen,
}: RectangleProps) => {
  const topLeft = worldToScreen(entity.topLeft);
  const width = entity.width * viewState.zoom;
  const height = entity.height * viewState.zoom;

  ctx.beginPath();
  ctx.rect(topLeft.x, topLeft.y, width, height);
  if (entity.properties?.fillColor) {
    ctx.fill();
  }
  ctx.stroke();
};
