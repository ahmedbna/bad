import { Entity, Point, ViewState } from '@/hooks/CADContext';
import { drawPointHandle } from './draw-point-handle';

type SelectionHighlightProps = {
  ctx: CanvasRenderingContext2D;
  viewState: ViewState;
  selectedEntities: string[];
  entities: Entity[];
  worldToScreen: (point: Point) => Point;
};

export const drawSelectionHighlights = ({
  ctx,
  viewState,
  selectedEntities,
  entities,
  worldToScreen,
}: SelectionHighlightProps) => {
  if (!selectedEntities.length) return;

  selectedEntities.forEach((id) => {
    const entity = entities.find((e) => e.id === id);
    if (!entity) return;

    // Draw selection highlight
    ctx.strokeStyle = '#1E90FF';
    ctx.lineWidth = 2;

    switch (entity.type) {
      case 'line': {
        const startPoint = worldToScreen(entity.start);
        const endPoint = worldToScreen(entity.end);

        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();

        // Draw handles
        drawPointHandle(ctx, startPoint);
        drawPointHandle(ctx, endPoint);
        break;
      }
      case 'circle': {
        const centerPoint = worldToScreen(entity.center);
        const radius = entity.radius * viewState.zoom;

        ctx.beginPath();
        ctx.arc(centerPoint.x, centerPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw handles
        drawPointHandle(ctx, centerPoint);
        drawPointHandle(ctx, {
          x: centerPoint.x + radius,
          y: centerPoint.y,
        });
        break;
      }
      case 'rectangle': {
        const topLeft = worldToScreen(entity.topLeft);
        const width = entity.width * viewState.zoom;
        const height = entity.height * viewState.zoom;

        ctx.beginPath();
        ctx.rect(topLeft.x, topLeft.y, width, height);
        ctx.stroke();

        // Draw handles
        drawPointHandle(ctx, topLeft);
        drawPointHandle(ctx, { x: topLeft.x + width, y: topLeft.y });
        drawPointHandle(ctx, { x: topLeft.x, y: topLeft.y + height });
        drawPointHandle(ctx, { x: topLeft.x + width, y: topLeft.y + height });
        break;
      }
      case 'polyline': {
        if (!entity.points || entity.points.length < 2) return;

        const transformedPoints = entity.points.map(worldToScreen);

        ctx.beginPath();
        ctx.moveTo(transformedPoints[0].x, transformedPoints[0].y);

        for (let i = 1; i < transformedPoints.length; i++) {
          ctx.lineTo(transformedPoints[i].x, transformedPoints[i].y);
        }

        ctx.stroke();

        // Draw handles at each point
        transformedPoints.forEach((point) => {
          drawPointHandle(ctx, point);
        });
        break;
      }
      case 'text': {
        const position = worldToScreen(entity.position);

        // Draw a box around the text
        const textWidth = ctx.measureText(entity.content).width;
        const textHeight = entity.fontSize * viewState.zoom;

        ctx.beginPath();
        ctx.rect(position.x - 2, position.y - 2, textWidth + 4, textHeight + 4);
        ctx.stroke();

        // Draw handle at text position
        drawPointHandle(ctx, position);
        break;
      }
    }
  });
};
