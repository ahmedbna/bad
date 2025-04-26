import { Point, ViewState } from '@/hooks/CADContext';
import { drawCircle } from './draw-circle';
import { drawLine } from './draw-line';
import { drawPolyline } from './draw-polyline';
import { drawRectangle } from './draw-rectangle';

type TemporaryEntityProps = {
  ctx: CanvasRenderingContext2D;
  entity: any;
  viewState: ViewState;
  worldToScreen: (point: Point) => Point;
};

export const drawTemporaryEntity = ({
  ctx,
  entity,
  viewState,
  worldToScreen,
}: TemporaryEntityProps) => {
  ctx.strokeStyle = entity.properties?.strokeColor || '#3498db';
  ctx.lineWidth = entity.properties?.strokeWidth || 2;
  ctx.setLineDash([5, 5]);

  switch (entity.type) {
    case 'line':
      drawLine({ ctx, entity, worldToScreen });
      break;
    case 'circle':
      drawCircle({ ctx, entity, viewState, worldToScreen });
      break;
    case 'rectangle':
      drawRectangle({ ctx, entity, viewState, worldToScreen });
      break;
    case 'polyline':
      drawPolyline({ ctx, entity, worldToScreen });
      break;
    default:
      break;
  }

  ctx.setLineDash([]);
};
