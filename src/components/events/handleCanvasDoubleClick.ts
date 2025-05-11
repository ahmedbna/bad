import { Point, ShapeProperties, TextParams } from '@/types';
import { DrawingTool } from '@/constants';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { Doc, Id } from '@/convex/_generated/dataModel';

type Props = {
  e: React.MouseEvent<HTMLCanvasElement>;
  selectedTool: DrawingTool;
  drawingPoints: Array<Point>;
  splineTension: number;
  scale: number;
  offset: Point;
  shapes: Array<Doc<'shapes'>>;
  setShowTextDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setTextParams: React.Dispatch<React.SetStateAction<TextParams>>;
  completeShape: (points: Point[], properties?: any) => void;
  setEditingTextId: React.Dispatch<React.SetStateAction<Id<'shapes'> | null>>;
};

export const handleCanvasDoubleClick = ({
  e,
  selectedTool,
  drawingPoints,
  splineTension,
  completeShape,
  scale,
  offset,
  shapes,
  setShowTextDialog,
  setTextParams,
  setEditingTextId,
}: Props) => {
  if (selectedTool === 'spline' && drawingPoints.length >= 3) {
    completeShape(drawingPoints, { tension: splineTension });
    return;
  }

  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const worldPoint = canvasToWorld({
    point: { x: mouseX, y: mouseY },
    scale,
    offset,
  });

  // Check for text shape intersection
  for (const shape of shapes) {
    if (shape.type !== 'text') continue;

    const isInside = isPointInTextBounds(
      worldPoint,
      shape.points[0],
      shape.properties.textParams?.content || ' ',
      shape.properties.textParams?.fontSize || 24,
      shape.properties.textParams?.rotation || 0,
      (shape.properties.textParams?.justification as
        | 'left'
        | 'center'
        | 'right') || 'center',
      scale
    );

    if (isInside) {
      setEditingTextId(shape._id);

      setTextParams({
        content: shape.properties.textParams?.content || ' ',
        fontSize: shape.properties.textParams?.fontSize || 24,
        fontFamily: shape.properties.textParams?.fontFamily || 'Arial',
        fontStyle: shape.properties.textParams?.fontStyle || 'normal',
        fontWeight: shape.properties.textParams?.fontWeight || 'normal',
        rotation: shape.properties.textParams?.rotation || 0,
        justification:
          (shape.properties.textParams?.justification as
            | 'left'
            | 'center'
            | 'right') || 'center',
      });

      setShowTextDialog(true);
      break;
    }
  }
};

// Helper function to check if a point is within text bounds
const isPointInTextBounds = (
  worldPoint: Point,
  textPosition: Point,
  text: string,
  fontSize: number,
  rotation: number,
  justification: 'left' | 'center' | 'right',
  scale: number
): boolean => {
  const charWidth = fontSize * 0.6;
  const textWidth = text.length * charWidth;
  const textHeight = fontSize;
  const tolerance = 5 / scale;

  // Adjust position based on justification
  let originX = textPosition.x;
  if (justification === 'center') {
    originX -= textWidth / 2;
  } else if (justification === 'right') {
    originX -= textWidth;
  }

  const originY = textPosition.y;

  // Translate world point to local coordinate system
  const dx = worldPoint.x - originX;
  const dy = worldPoint.y - originY;

  // Apply inverse rotation
  const theta = -rotation * (Math.PI / 180);
  const localX = dx * Math.cos(theta) - dy * Math.sin(theta);
  const localY = dx * Math.sin(theta) + dy * Math.cos(theta);

  // Check bounds in local space
  return (
    localX >= -tolerance &&
    localX <= textWidth + tolerance &&
    localY >= -textHeight - tolerance &&
    localY <= tolerance
  );
};
