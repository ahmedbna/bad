import { Point, ViewState } from '@/hooks/CADContext';

type TextProps = {
  ctx: CanvasRenderingContext2D;
  entity: any;
  viewState: ViewState;
  worldToScreen: (point: Point) => Point;
};

export const drawText = ({
  ctx,
  entity,
  viewState,
  worldToScreen,
}: TextProps) => {
  const position = worldToScreen(entity.position);

  ctx.font = `${entity.fontSize * viewState.zoom}px ${
    entity.fontFamily || 'Arial'
  }`;
  ctx.fillStyle = entity.properties?.strokeColor || '#000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillText(entity.content, position.x, position.y);
};
