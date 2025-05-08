import { DrawingTool } from '@/constants';
import { Point, Shape, ShapeProperties } from '@/types';
import { calculateDistance } from '@/utils/calculations';

interface HandleCoordinateInputConfirmProps {
  coordinateInput: { x: string; y: string };
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
  completeShape: (points: Point[], properties?: ShapeProperties) => void;
  setCoordinateInput: React.Dispatch<
    React.SetStateAction<{ x: string; y: string }>
  >;
  setDrawingStep: React.Dispatch<React.SetStateAction<number>>;
  propertyInput: {
    length: string;
    width: string;
    height: string;
    radius: string;
    diameter: string;
    direction: string;
    radiusX: string;
    radiusY: string;
    startAngle: string;
    endAngle: string;
    sides: string;
    rotation: string;
    tension: string;
  };
  ellipseParams: {
    radiusX: number;
    radiusY: number;
    rotation: number;
    isFullEllipse: boolean;
  };
  splineTension: number;
  polygonSides: number;
  textParams?: any;
  dimensionParams?: any;
}

export const handleCoordinateInputConfirm = ({
  coordinateInput,
  selectedTool,
  drawingPoints,
  setDrawingPoints,
  setTempShape,
  completeShape,
  setCoordinateInput,
  setDrawingStep,
  propertyInput,
  ellipseParams,
  splineTension,
  polygonSides,
  textParams,
  dimensionParams,
}: HandleCoordinateInputConfirmProps) => {
  // Parse coordinate input
  const x = parseFloat(coordinateInput.x);
  const y = parseFloat(coordinateInput.y);

  // Ensure values are valid numbers
  if (isNaN(x) || isNaN(y)) return;

  const newPoint: Point = { x, y };

  // If it's the first point
  if (drawingPoints.length === 0) {
    // Start new shape
    setDrawingPoints([newPoint]);
    setTempShape({
      id: `temp-${Date.now()}`,
      type: selectedTool,
      points: [newPoint],
      properties: {},
    });
    setCoordinateInput({ x: '', y: '' });
    setDrawingStep(1);
    return;
  }

  // Handle different tools differently
  switch (selectedTool) {
    case 'line':
      completeShape([drawingPoints[0], newPoint]);
      setDrawingStep(0);
      break;

    case 'polyline':
      const updatedPoints = [...drawingPoints, newPoint];
      setDrawingPoints(updatedPoints);
      setTempShape((prev) =>
        prev
          ? {
              ...prev,
              points: updatedPoints,
            }
          : null
      );
      setDrawingStep((prev) => prev + 1);
      break;

    case 'rectangle':
      completeShape([drawingPoints[0], newPoint]);
      setDrawingStep(0);
      break;

    case 'circle':
      const center = drawingPoints[0];
      const radius = calculateDistance(center, newPoint);
      completeShape([center], { radius });
      setDrawingStep(0);
      break;

    case 'ellipse':
      if (drawingPoints.length === 1) {
        // Second point sets the first axis
        const center = drawingPoints[0];
        const dx = newPoint.x - center.x;
        const dy = newPoint.y - center.y;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);

        setDrawingPoints([...drawingPoints, newPoint]);
        setTempShape((prev) =>
          prev
            ? {
                ...prev,
                points: [...drawingPoints, newPoint],
                properties: {
                  radiusX: distance,
                  radiusY: ellipseParams.radiusY,
                  rotation: angle,
                  isFullEllipse: ellipseParams.isFullEllipse,
                },
              }
            : null
        );
        setDrawingStep(2);
      } else if (drawingPoints.length === 2) {
        // Third point sets the second axis
        const center = drawingPoints[0];
        const firstPoint = drawingPoints[1];
        const radiusX = calculateDistance(center, firstPoint);
        const dx1 = firstPoint.x - center.x;
        const dy1 = firstPoint.y - center.y;
        const angle = Math.atan2(dy1, dx1);

        // Calculate perpendicular distance for radiusY
        const dx2 = newPoint.x - center.x;
        const dy2 = newPoint.y - center.y;

        // Project onto perpendicular axis
        const perpAngle = angle + Math.PI / 2;
        const cosPerp = Math.cos(perpAngle);
        const sinPerp = Math.sin(perpAngle);
        const dotProduct = dx2 * cosPerp + dy2 * sinPerp;
        const radiusY = Math.abs(dotProduct);

        completeShape([center], {
          radiusX,
          radiusY,
          rotation: angle,
          isFullEllipse: ellipseParams.isFullEllipse,
        });
        setDrawingStep(0);
      }
      break;

    case 'polygon':
      const polygonCenter = drawingPoints[0];
      const polygonRadius = calculateDistance(polygonCenter, newPoint);
      completeShape([polygonCenter], {
        radius: polygonRadius,
        sides: polygonSides,
      });
      setDrawingStep(0);
      break;

    case 'spline':
      const updatedSplinePoints = [...drawingPoints, newPoint];
      setDrawingPoints(updatedSplinePoints);
      setTempShape((prev) =>
        prev
          ? {
              ...prev,
              points: updatedSplinePoints,
              properties: { tension: splineTension },
            }
          : null
      );
      setDrawingStep((prev) => prev + 1);
      break;

    case 'text':
      if (textParams) {
        completeShape([newPoint], { textParams });
        setDrawingStep(0);
      }
      break;

    case 'dimension':
      if (drawingPoints.length === 0) {
        setDrawingPoints([newPoint]);
        setTempShape({
          id: `temp-dim-${Date.now()}`,
          type: 'dimension',
          points: [newPoint],
          properties: {
            dimensionParams: dimensionParams || {},
            isCompleted: false,
          },
        });
        setDrawingStep(1);
      } else if (drawingPoints.length === 1) {
        const p1 = drawingPoints[0];
        const p2 = newPoint;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate the midpoint for text position
        const midPoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };

        // Get perpendicular offset for text
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        const offsetAmount = dimensionParams?.offset || 25;

        // Calculate text position
        const textPosition = {
          x: midPoint.x + Math.cos(perpAngle) * offsetAmount,
          y: midPoint.y + Math.sin(perpAngle) * offsetAmount,
        };

        completeShape([p1, p2], {
          dimensionParams: {
            ...dimensionParams,
            value: distance,
            textPosition: textPosition,
          },
        });
        setDrawingStep(0);
      }
      break;

    default:
      // Generic case
      completeShape([...drawingPoints, newPoint]);
      setDrawingStep(0);
      break;
  }

  setCoordinateInput({ x: '', y: '' });
};

interface HandlePropertyInputConfirmProps {
  propertyInput: {
    length: string;
    width: string;
    height: string;
    radius: string;
    diameter: string;
    direction: string;
    radiusX: string;
    radiusY: string;
    startAngle: string;
    endAngle: string;
    sides: string;
    rotation: string;
    tension: string;
  };
  propertyType: string;
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
  completeShape: (points: Point[], properties?: ShapeProperties) => void;
  setPropertyInput: React.Dispatch<
    React.SetStateAction<{
      length: string;
      width: string;
      height: string;
      radius: string;
      diameter: string;
      direction: string;
      radiusX: string;
      radiusY: string;
      startAngle: string;
      endAngle: string;
      sides: string;
      rotation: string;
      tension: string;
    }>
  >;
  setDrawingStep: React.Dispatch<React.SetStateAction<number>>;
  polygonSides: number;
  setPolygonSides: React.Dispatch<React.SetStateAction<number>>;
  setSplineTension: React.Dispatch<React.SetStateAction<number>>;
}

export const handlePropertyInputConfirm = ({
  propertyInput,
  propertyType,
  selectedTool,
  drawingPoints,
  setDrawingPoints,
  setTempShape,
  completeShape,
  setPropertyInput,
  setDrawingStep,
  polygonSides,
  setPolygonSides,
  setSplineTension,
}: HandlePropertyInputConfirmProps) => {
  if (drawingPoints.length === 0) return;

  const parseValue = (value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const firstPoint = drawingPoints[0];

  switch (selectedTool) {
    case 'line':
      if (propertyType === 'length') {
        const length = parseValue(propertyInput.length);
        if (length <= 0) return;

        // Default direction is horizontal if no second point exists
        let angle = 0;

        if (drawingPoints.length > 1) {
          const lastPoint = drawingPoints[drawingPoints.length - 1];
          angle = Math.atan2(
            lastPoint.y - firstPoint.y,
            lastPoint.x - firstPoint.x
          );
        }

        const endPoint = {
          x: firstPoint.x + length * Math.cos(angle),
          y: firstPoint.y + length * Math.sin(angle),
        };

        completeShape([firstPoint, endPoint]);
        setDrawingStep(0);
      }
      break;

    case 'rectangle':
      const width = parseValue(propertyInput.width);
      const height = parseValue(propertyInput.height);

      if (width > 0 && height > 0) {
        const secondPoint = {
          x: firstPoint.x + width,
          y: firstPoint.y + height,
        };

        completeShape([firstPoint, secondPoint]);
        setDrawingStep(0);
      }
      break;

    case 'circle':
      if (propertyType === 'radius') {
        const radius = parseValue(propertyInput.radius);
        if (radius <= 0) return;

        completeShape([firstPoint], { radius });
        setDrawingStep(0);
      } else if (propertyType === 'diameter') {
        const diameter = parseValue(propertyInput.diameter);
        if (diameter <= 0) return;

        completeShape([firstPoint], { radius: diameter / 2 });
        setDrawingStep(0);
      }
      break;

    case 'ellipse':
      if (propertyType === 'radiusX' && drawingPoints.length === 1) {
        const radiusX = parseValue(propertyInput.radiusX);
        if (radiusX <= 0) return;

        // Default angle is horizontal (0 degrees)
        const angle = 0;
        const secondPoint = {
          x: firstPoint.x + radiusX,
          y: firstPoint.y,
        };

        setDrawingPoints([...drawingPoints, secondPoint]);
        setTempShape((prev) =>
          prev
            ? {
                ...prev,
                points: [...drawingPoints, secondPoint],
                properties: {
                  radiusX,
                  radiusY: 0, // To be set in next step
                  rotation: angle,
                  isFullEllipse: true,
                },
              }
            : null
        );
        setDrawingStep(2);
      } else if (propertyType === 'radiusY' && drawingPoints.length === 2) {
        const radiusY = parseValue(propertyInput.radiusY);
        if (radiusY <= 0) return;

        // Get radiusX from tempShape properties
        const radiusX = parseValue(propertyInput.radiusX);
        const rotation = 0; // Default horizontal

        completeShape([firstPoint], {
          radiusX,
          radiusY,
          rotation,
          isFullEllipse: true,
        });
        setDrawingStep(0);
      }
      break;

    case 'polygon':
      if (propertyType === 'radius') {
        const radius = parseValue(propertyInput.radius);
        if (radius <= 0) return;

        completeShape([firstPoint], {
          radius,
          sides: parseInt(propertyInput.sides) || polygonSides,
        });
        setDrawingStep(0);
      } else if (propertyType === 'sides') {
        const sides = parseInt(propertyInput.sides);
        if (sides < 3) return;

        setPolygonSides(sides);
        setPropertyInput((prev) => ({ ...prev, sides: sides.toString() }));
      }
      break;

    case 'spline':
      if (propertyType === 'tension') {
        const tension = parseValue(propertyInput.tension);
        if (tension < 0 || tension > 1) return;

        setSplineTension(tension);
        setTempShape((prev) =>
          prev
            ? {
                ...prev,
                properties: { ...prev.properties, tension },
              }
            : null
        );
      }
      break;
  }

  // Reset the specific property input that was just used
  setPropertyInput((prev) => ({ ...prev, [propertyType]: '' }));
};
