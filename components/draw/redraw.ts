import { Entity, Point, ViewState } from '@/hooks/CADContext';
import { DrawingState } from '@/components/cad/canvas';
import { drawGrid } from './draw-grid';
import { drawOrigin } from './draw-origin';
import { drawEntities } from './draw-entities';
import { drawSelectionHighlights } from './draw-selection-highlights';
import { drawTemporaryEntity } from './draw-temporary-entity';

interface RedrawInterface {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewState: ViewState;
  drawingState: DrawingState;
  entities: Entity[];
  selectedEntities: string[];
  worldToScreen: (point: Point) => Point;
}

export const redraw = ({
  canvasRef,
  viewState,
  drawingState,
  entities,
  selectedEntities,
  worldToScreen,
}: RedrawInterface) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw grid if enabled
  if (viewState.grid.enabled) {
    drawGrid({ viewState, ctx, width, height });
  }

  // Draw origin
  drawOrigin({ ctx, viewState });

  // Draw all entities
  drawEntities({ ctx, entities, viewState, worldToScreen });

  // Draw selection highlights
  drawSelectionHighlights({
    ctx,
    viewState,
    selectedEntities,
    entities,
    worldToScreen,
  });

  // Draw temporary elements based on current tool and drawing state
  if (drawingState.isDrawing && drawingState.temporaryEntity) {
    drawTemporaryEntity({
      ctx,
      entity: drawingState.temporaryEntity,
      viewState,
      worldToScreen,
    });
  }
};
