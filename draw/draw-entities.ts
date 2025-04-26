import { Entity, Point, ViewState } from '@/hooks/CADContext';
import { drawLine } from './draw-line';
import { drawCircle } from './draw-circle';
import { drawRectangle } from './draw-rectangle';
import { drawPolyline } from './draw-polyline';
import { drawText } from './draw-text';

type EntitiesProps = {
  ctx: CanvasRenderingContext2D;
  entities: Entity[];
  viewState: ViewState;
  worldToScreen: (point: Point) => Point;
};

export const drawEntities = ({
  ctx,
  entities,
  viewState,
  worldToScreen,
}: EntitiesProps) => {
  // Draw each entity based on its type and properties
  entities.forEach((entity: any) => {
    const strokeColor = entity.properties?.strokeColor || '#000';
    const strokeWidth = entity.properties?.strokeWidth || 1;
    const fillColor = entity.properties?.fillColor;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    if (fillColor) {
      ctx.fillStyle = fillColor;
    }

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
      case 'text':
        drawText({ ctx, entity, viewState, worldToScreen });
        break;
      default:
        console.warn(`Unknown entity type: ${entity.type}`);
    }
  });
};
