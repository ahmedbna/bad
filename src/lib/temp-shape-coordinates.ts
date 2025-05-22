import { DrawingTool } from '@/constants';
import { Point, ShapeProperties } from '@/types';
import { getTempShape } from './get-temp-shape';

type Props = {
  step: number;
  point: Point; // Current cursor position
  drawingPoints: Point[]; // Points already drawn
  selectedTool: DrawingTool;
  propertyInput: ShapeProperties;
  setTempShape: React.Dispatch<React.SetStateAction<any>>;
};

// Update temp shape with cursor position (for live preview)
export const updateTempShapeFromCoordinates = ({
  step,
  point,
  drawingPoints,
  selectedTool,
  propertyInput,
  setTempShape,
}: Props) => {
  if (drawingPoints.length === 0) return;

  const basePoint = drawingPoints[0];

  switch (selectedTool) {
    case 'line':
      setTempShape(getTempShape({ type: 'line', points: [basePoint, point] }));
      break;

    case 'rectangle':
      setTempShape(
        getTempShape({
          type: 'rectangle',
          points: [basePoint, point],
        })
      );

      break;

    case 'circle':
      const radius = Math.hypot(point.x - basePoint.x, point.y - basePoint.y);

      setTempShape(
        getTempShape({
          type: 'circle',
          points: [basePoint],
          properties: { radius },
        })
      );

      break;

    case 'ellipse':
      if (step === 1) {
        // First axis endpoint
        const radiusX = Math.hypot(
          point.x - basePoint.x,
          point.y - basePoint.y
        );

        setTempShape(
          getTempShape({
            type: 'ellipse',
            points: [basePoint],
            properties: {
              radiusX,
              radiusY: radiusX / 2,
              isFullEllipse: true,
            },
          })
        );
      } else if (step === 2 && drawingPoints.length >= 2) {
        // Second axis endpoint
        const dx = drawingPoints[1].x - basePoint.x;
        const dy = drawingPoints[1].y - basePoint.y;
        const angle = Math.atan2(dy, dx);

        // Calculate perpendicular vector
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);

        // Calculate projection of point onto perpendicular vector
        const dotProduct =
          (point.x - basePoint.x) * perpX + (point.y - basePoint.y) * perpY;

        const radiusX = Math.hypot(dx, dy);
        const radiusY = Math.abs(dotProduct);

        setTempShape(
          getTempShape({
            type: 'ellipse',
            points: [basePoint],
            properties: {
              radiusX,
              radiusY,
              rotation: angle,
              isFullEllipse: true,
            },
          })
        );
      }
      break;

    case 'polygon':
      const polygonRadius = Math.hypot(
        point.x - basePoint.x,
        point.y - basePoint.y
      );

      setTempShape(
        getTempShape({
          type: 'polygon',
          points: [basePoint],
          properties: {
            radius: polygonRadius,
            sides: propertyInput.sides || 6,
          },
        })
      );

      break;

    case 'arc':
      if (step === 1) {
        // 3-point arc (storing second point)
        setTempShape(
          getTempShape({
            type: 'arc',
            points: [basePoint, point],
          })
        );
      } else if (step === 2 && drawingPoints.length >= 2) {
        // 3-point arc (complete with third point)
        setTempShape(
          getTempShape({
            type: 'arc',
            points: [basePoint, drawingPoints[1], point],
          })
        );
      }
      break;

    case 'spline':
      const splinePoints = [...drawingPoints, point];

      setTempShape(
        getTempShape({
          type: 'spline',
          points: splinePoints,
          properties: {
            tension: propertyInput.tension || 0.5,
          },
        })
      );

      break;

    case 'dimension':
      if (step === 1) {
        setTempShape(
          getTempShape({
            type: 'dimension',
            points: [basePoint, point],
          })
        );
      } else if (step === 2 && drawingPoints.length >= 2) {
        setTempShape(
          getTempShape({
            type: 'dimension',
            points: [basePoint, drawingPoints[1], point],
          })
        );
      }
      break;

    default:
      break;
  }
};
