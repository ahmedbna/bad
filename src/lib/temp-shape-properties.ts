import { DrawingTool } from '@/constants';
import { Point, ShapeProperties } from '@/types';
import { getTempShape } from './get-temp-shape';

type Props = {
  step: number;
  drawingPoints: Point[];
  updatedPropertyInput: ShapeProperties;
  field: string;
  selectedTool: DrawingTool;
  setTempShape: React.Dispatch<React.SetStateAction<any>>;
  setCoordinateInput: React.Dispatch<React.SetStateAction<Point>>;
};

export const updateTempShapeWithNewProperties = ({
  step,
  selectedTool,
  drawingPoints,
  updatedPropertyInput,
  field,
  setTempShape,
  setCoordinateInput,
}: Props) => {
  if (drawingPoints.length === 0) return;

  const basePoint = drawingPoints[0];

  switch (selectedTool) {
    case 'line':
      if (step === 1) {
        // Get values directly from the updated properties
        const length = updatedPropertyInput.length || 0;
        const direction = (updatedPropertyInput.angle || 0) * (Math.PI / 180);

        if (!isNaN(length) && !isNaN(direction)) {
          const secondPoint = {
            x: basePoint.x + length * Math.cos(direction),
            y: basePoint.y + length * Math.sin(direction),
          };

          setTempShape(
            getTempShape({ type: 'line', points: [basePoint, secondPoint] })
          );

          // Update coordinate display
          setCoordinateInput({
            x: secondPoint.x,
            y: secondPoint.y,
          });
        }
      }
      break;

    case 'rectangle':
      if (step === 1) {
        const width = updatedPropertyInput.width || 0;
        const length = updatedPropertyInput.length || 0;

        if (!isNaN(width) && !isNaN(length)) {
          const secondPoint = {
            x: basePoint.x + width,
            y: basePoint.y + length,
          };

          setTempShape(
            getTempShape({
              type: 'rectangle',
              points: [basePoint, secondPoint],
            })
          );

          setCoordinateInput({
            x: secondPoint.x,
            y: secondPoint.y,
          });
        }
      }
      break;

    case 'circle':
      if (step === 1) {
        let radius;
        if (field === 'radius' && updatedPropertyInput.radius) {
          radius = updatedPropertyInput.radius;
        } else if (field === 'diameter' && updatedPropertyInput.diameter) {
          radius = updatedPropertyInput.diameter / 2;
        } else {
          radius =
            updatedPropertyInput.radius ||
            (updatedPropertyInput.diameter || 0) / 2 ||
            0;
        }

        if (!isNaN(radius) && radius > 0) {
          // Generate a point on the circle perimeter for coordinate display
          const angle = 0; // Default to right side of circle
          const circlePoint = {
            x: basePoint.x + radius * Math.cos(angle),
            y: basePoint.y + radius * Math.sin(angle),
          };

          setTempShape(
            getTempShape({
              type: 'circle',
              points: [basePoint],
              properties: { radius },
            })
          );

          setCoordinateInput({
            x: circlePoint.x,
            y: circlePoint.y,
          });
        }
      }
      break;

    case 'ellipse':
      if (step >= 1) {
        const radiusX = updatedPropertyInput.radiusX || 0;
        const radiusY = updatedPropertyInput.radiusY || 0;
        const rotation = (updatedPropertyInput.rotation || 0) * (Math.PI / 180);

        if (!isNaN(radiusX) && !isNaN(radiusY)) {
          // Generate a point on the ellipse perimeter
          const angle = rotation;
          const ellipsePoint = {
            x: basePoint.x + radiusX * Math.cos(angle),
            y: basePoint.y + radiusY * Math.sin(angle),
          };

          setTempShape(
            getTempShape({
              type: 'ellipse',
              points: [basePoint],
              properties: {
                radiusX,
                radiusY,
                rotation,
                isFullEllipse: true,
              },
            })
          );

          setCoordinateInput({
            x: ellipsePoint.x,
            y: ellipsePoint.y,
          });
        }
      }
      break;

    case 'polygon':
      if (step === 1) {
        const radius = updatedPropertyInput.radius || 0;
        const sides = updatedPropertyInput.sides || 6;

        if (!isNaN(radius) && !isNaN(sides)) {
          // Generate a point on the polygon perimeter
          const angle = 0;
          const polygonPoint = {
            x: basePoint.x + radius * Math.cos(angle),
            y: basePoint.y + radius * Math.sin(angle),
          };

          setTempShape(
            getTempShape({
              type: 'polygon',
              points: [basePoint],
              properties: {
                radius,
                sides,
              },
            })
          );

          setCoordinateInput({
            x: polygonPoint.x,
            y: polygonPoint.y,
          });
        }
      }
      break;

    case 'arc':
      if (step === 1) {
        const radius = updatedPropertyInput.radius || 0;
        const startAngle =
          (updatedPropertyInput.startAngle || 0) * (Math.PI / 180);
        const endAngle = (updatedPropertyInput.endAngle || 0) * (Math.PI / 180);

        if (!isNaN(radius) && !isNaN(startAngle) && !isNaN(endAngle)) {
          // Generate a point on the arc
          const arcPoint = {
            x: basePoint.x + radius * Math.cos(endAngle),
            y: basePoint.y + radius * Math.sin(endAngle),
          };

          setTempShape(
            getTempShape({
              type: 'arc',
              points: [basePoint],
              properties: {
                radius,
                startAngle,
                endAngle,
              },
            })
          );

          setCoordinateInput({
            x: arcPoint.x,
            y: arcPoint.y,
          });
        }
      }
      break;

    case 'spline':
      if (step >= 2) {
        const tension = updatedPropertyInput.tension || 0.5;
        if (!isNaN(tension)) {
          setTempShape(
            getTempShape({
              type: 'spline',
              points: drawingPoints,
              properties: { tension },
            })
          );
        }
      }
      break;

    default:
      break;
  }
};
