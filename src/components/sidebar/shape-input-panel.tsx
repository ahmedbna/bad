'use client';

import { RefObject, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Point, ShapeProperties } from '@/types';
import { DrawingTool } from '@/constants';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { Doc } from '@/convex/_generated/dataModel';
import { getTempShape } from '@/lib/get-temp-shape';
import {
  calculateCircleProperties,
  calculateDistance,
  calculateEllipseProperties,
  calculateLineProperties,
  calculatePolygonProperties,
  calculatePolylineProperties,
  calculateRectangleProperties,
  calculateSplineProperties,
} from '@/utils/calculations';
import { updateTempShapeFromCoordinates } from '@/lib/temp-shape-coordinates';

interface ShapeInputPanelProps {
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  completeShape: (points: Point[], properties?: ShapeProperties) => void;
  handleCancelDrawing: () => void;
  setTempShape: (shape: Doc<'shapes'> & { layer: Doc<'layers'> }) => void;
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  lineLengthRef: RefObject<HTMLInputElement | null>;
  lineAngleRef: RefObject<HTMLInputElement | null>;
  rectangleWidthRef: RefObject<HTMLInputElement | null>;
  rectangleLengthRef: RefObject<HTMLInputElement | null>;
  circleRadiusRef: RefObject<HTMLInputElement | null>;
  circleDiameterRef: RefObject<HTMLInputElement | null>;
  arcRadiusRef: RefObject<HTMLInputElement | null>;
  arcStartAngleRef: RefObject<HTMLInputElement | null>;
  arcEndAngleRef: RefObject<HTMLInputElement | null>;
  polygonRadiusRef: RefObject<HTMLInputElement | null>;
  polygonSidesRef: RefObject<HTMLInputElement | null>;
  ellipseRadiusXRef: RefObject<HTMLInputElement | null>;
  ellipseRadiusYRef: RefObject<HTMLInputElement | null>;
  ellipseRotationRef: RefObject<HTMLInputElement | null>;
  splineTensionRef: RefObject<HTMLInputElement | null>;
  xCoordinatenRef: RefObject<HTMLInputElement | null>;
  yCoordinatenRef: RefObject<HTMLInputElement | null>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => void;
  step: number;
  propertyInput: ShapeProperties;
  coordinateInput: Point;
  setCoordinateInput: React.Dispatch<React.SetStateAction<Point>>;
  setPropertyInput: React.Dispatch<React.SetStateAction<ShapeProperties>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

export const ShapeInputPanel = ({
  selectedTool,
  drawingPoints,
  completeShape,
  handleCancelDrawing,
  setTempShape,
  setDrawingPoints,
  lineLengthRef,
  lineAngleRef,
  rectangleWidthRef,
  rectangleLengthRef,
  circleRadiusRef,
  circleDiameterRef,
  arcRadiusRef,
  arcStartAngleRef,
  arcEndAngleRef,
  polygonRadiusRef,
  polygonSidesRef,
  ellipseRadiusXRef,
  ellipseRadiusYRef,
  ellipseRotationRef,
  splineTensionRef,
  xCoordinatenRef,
  yCoordinatenRef,
  handleInputChange,
  coordinateInput,
  setCoordinateInput,
  propertyInput,
  setPropertyInput,
  step,
  setStep,
}: ShapeInputPanelProps) => {
  const [prompt, setPrompt] = useState('');

  // Reset step when tool changes
  useEffect(() => {
    setStep(0);
    setCoordinateInput({ x: 0, y: 0 });
    setPropertyInput({});
  }, [selectedTool]);

  // Update step based on drawing points
  useEffect(() => {
    setStep(drawingPoints.length);

    // If there are drawing points, update the coordinate input for the last point
    if (drawingPoints.length > 0) {
      const lastPoint = drawingPoints[drawingPoints.length - 1];
      setCoordinateInput(lastPoint);

      updateTempShapeFromProperties();
    }
  }, [drawingPoints]);

  // Handle Enter key press
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputConfirm();
    } else if (e.key === 'Escape') {
      handleCancelDrawing();
    }
  };

  // Process coordinate-based input
  const processCoordinateInput = () => {
    if (coordinateInput.x && coordinateInput.y) {
      const point = coordinateInput;

      if (!isNaN(point.x) && !isNaN(point.y)) {
        if (step === 0) {
          // First point
          const newPoints = [point];

          if (selectedTool === 'text') {
            // Complete text with a single point
            completeShape(newPoints, propertyInput);
            setStep(0);
          } else {
            // Continue with additional points for other shapes
            setDrawingPoints(newPoints);
            setStep(1);

            updateTempShapeFromCoordinates({
              step,
              point,
              drawingPoints,
              selectedTool,
              propertyInput,
              setTempShape,
            });
          }
        } else {
          // Process based on shape type
          processShapeCompletion(point);
        }

        // Clear coordinate input after processing
        setCoordinateInput({ x: 0, y: 0 });
      }
    }
  };

  // Handle input confirmation
  const handleInputConfirm = () => {
    // Handle coordinate input
    processCoordinateInput();

    // If no coordinates, check for property input
    // if (!coordinateInput.x || !coordinateInput.y) {
    //   if (isPropertyInputValid()) {
    //     processPropertyInput();
    //   }
    // }
  };

  // Check if property input is valid
  const isPropertyInputValid = () => {
    switch (selectedTool) {
      case 'rectangle':
        return propertyInput.width && propertyInput.length;
      case 'circle':
        return propertyInput.radius || propertyInput.diameter;
      case 'polygon':
        return propertyInput.radius && propertyInput.sides;
      case 'ellipse':
        return propertyInput.radiusX && propertyInput.radiusY;
      case 'line':
        return propertyInput.length && propertyInput.angle && step === 1;
      case 'arc':
        return (
          propertyInput.radius &&
          propertyInput.startAngle &&
          propertyInput.endAngle &&
          step === 1
        );
      default:
        return false;
    }
  };

  // Process shape completion based on coordinates
  const processShapeCompletion = (point: Point) => {
    switch (selectedTool) {
      case 'line':
        const lineProps = calculateLineProperties(drawingPoints[0], point);

        completeShape([drawingPoints[0], point], lineProps);
        setStep(0);
        break;

      case 'polyline':
        const updatedPoints = [...drawingPoints, point];

        // Check if we're closing the polyline
        // (Within a small distance of the first point)
        const firstPoint = drawingPoints[0];
        const distanceToStart = Math.hypot(
          point.x - firstPoint.x,
          point.y - firstPoint.y
        );

        const isClosing = distanceToStart < 5 && drawingPoints.length > 2;

        if (isClosing) {
          const polylineProps = calculatePolylineProperties(updatedPoints);
          completeShape(updatedPoints, polylineProps);
          setStep(0);
        } else {
          // Continue adding points
          setDrawingPoints(updatedPoints);
          setStep(step + 1);

          // Update temp shape for preview
          updateTempShapeFromCoordinates({
            step,
            point,
            drawingPoints,
            selectedTool,
            propertyInput,
            setTempShape,
          });
        }
        break;

      case 'rectangle':
        const rectProps = calculateRectangleProperties(drawingPoints[0], point);

        completeShape([drawingPoints[0], point], rectProps);
        setStep(0);
        break;

      case 'circle':
        const center = drawingPoints[0];
        const radius = calculateDistance(center, point);
        const circleProps = calculateCircleProperties(radius);

        // For circle, second point determines radius
        completeShape([drawingPoints[0]], circleProps);
        setStep(0);
        break;

      case 'arc':
        // For 3-point arc
        if (step === 1) {
          setDrawingPoints([...drawingPoints, point]);
          setStep(2);
        } else if (step === 2) {
          completeShape([drawingPoints[0], drawingPoints[1], point], {});
          setStep(0);
        }
        break;

      case 'ellipse':
        if (step === 1) {
          setDrawingPoints([...drawingPoints, point]);
          setStep(2);
        } else if (step === 2) {
          // Calculate radiusX and radiusY based on the points
          const radiusX = Math.hypot(
            drawingPoints[1].x - drawingPoints[0].x,
            drawingPoints[1].y - drawingPoints[0].y
          );

          // Calculate perpendicular distance for radiusY
          const dx = drawingPoints[1].x - drawingPoints[0].x;
          const dy = drawingPoints[1].y - drawingPoints[0].y;
          const angle = Math.atan2(dy, dx);

          // Calculate perpendicular vector
          const perpX = -Math.sin(angle);
          const perpY = Math.cos(angle);

          // Calculate projection of third point onto perpendicular vector
          const dotProduct =
            (point.x - drawingPoints[0].x) * perpX +
            (point.y - drawingPoints[0].y) * perpY;

          const radiusY = Math.abs(dotProduct);

          // Calculate ellipse properties
          const ellipseProps = calculateEllipseProperties(
            radiusX,
            radiusY,
            true
          );

          completeShape([drawingPoints[0]], {
            ...ellipseProps,
            rotation: angle,
          });
          setStep(0);
        }
        break;

      case 'polygon':
        const polygonCenter = drawingPoints[0];
        const polygonRadius = calculateDistance(polygonCenter, point);
        const polygonSides = propertyInput.sides || 6;

        const polygonProps = calculatePolygonProperties(
          polygonRadius,
          polygonSides
        );

        // For polygon, second point determines radius
        completeShape([drawingPoints[0]], polygonProps);
        setStep(0);
        break;

      case 'spline':
        const splinePoints = [...drawingPoints, point];
        if (splinePoints.length >= 3) {
          const splineProps = calculateSplineProperties(
            splinePoints,
            propertyInput.tension || 0.5
          );

          completeShape(splinePoints, splineProps);
          setStep(0);
        } else {
          setDrawingPoints(splinePoints);
          setStep(step + 1);
        }
        break;

      // case 'dimension':
      //   if (step === 1) {
      //     setDrawingPoints([...drawingPoints, point]);
      //     setStep(2);
      //   } else if (step === 2) {
      //     completeShape([drawingPoints[0], drawingPoints[1], point]);
      //     setStep(0);
      //   }
      //   break;

      default:
        break;
    }
  };

  // Generate prompt based on tool and step
  useEffect(() => {
    generatePrompt();
  }, [selectedTool, step]);

  const generatePrompt = () => {
    // Otherwise show the step prompt
    switch (selectedTool) {
      case 'line':
        setPrompt(
          step === 0
            ? 'Specify first point:'
            : 'Specify second point or [Length/Angle]:'
        );
        break;

      case 'polyline':
        setPrompt(
          step === 0
            ? 'Specify first point:'
            : 'Specify next point or [Close/Undo]:'
        );
        break;

      case 'rectangle':
        setPrompt(
          step === 0
            ? 'Specify first corner point:'
            : 'Specify opposite corner or [Width/Height]:'
        );
        break;

      case 'circle':
        setPrompt(
          step === 0 ? 'Specify center point:' : 'Specify radius or [Diameter]:'
        );
        break;

      case 'arc':
        if (step === 0) setPrompt('Specify start point:');
        else if (step === 1)
          setPrompt('Specify second point or [Radius/StartAngle/EndAngle]:');
        else setPrompt('Specify end point:');
        break;

      case 'ellipse':
        if (step === 0) setPrompt('Specify center point:');
        else if (step === 1)
          setPrompt(
            'Specify first axis endpoint or [RadiusX/RadiusY/Rotation]:'
          );
        else setPrompt('Specify second axis distance:');
        break;

      case 'polygon':
        setPrompt(
          step === 0 ? 'Specify center point:' : 'Specify radius or [Sides]:'
        );
        break;

      case 'spline':
        if (step === 0) setPrompt('Specify first point:');
        else if (step < 3) setPrompt(`Specify point ${step + 1}:`);
        else setPrompt(`Specify next point or [Close/Undo/Tension]:`);
        break;

      case 'text':
        setPrompt('Specify insertion point:');
        break;

      case 'dimension':
        if (step === 0) setPrompt('Specify first extension line origin:');
        else if (step === 1) setPrompt('Specify second extension line origin:');
        else setPrompt('Specify dimension line location:');
        break;

      default:
        setPrompt('Select a drawing tool');
        break;
    }
  };

  // Fix the updateTempShapeFromProperties function
  const updateTempShapeFromProperties = () => {
    if (drawingPoints.length === 0) return;

    const basePoint = drawingPoints[0];

    switch (selectedTool) {
      case 'line':
        if (propertyInput.length && propertyInput.angle && step === 1) {
          const length = propertyInput.length;
          const angle = propertyInput.angle * (Math.PI / 180);

          if (!isNaN(length) && !isNaN(angle)) {
            const secondPoint = {
              x: basePoint.x + length * Math.cos(angle),
              y: basePoint.y + length * Math.sin(angle),
            };

            // Update coordinate input to reflect property changes
            setCoordinateInput({
              x: secondPoint.x,
              y: secondPoint.y,
            });

            setTempShape(
              getTempShape({ type: 'line', points: [basePoint, secondPoint] })
            );
          }
        }
        break;

      case 'rectangle':
        if (propertyInput.width && propertyInput.length && step === 1) {
          const width = propertyInput.width;
          const length = propertyInput.length;

          if (!isNaN(width) && !isNaN(length)) {
            const secondPoint = {
              x: basePoint.x + width,
              y: basePoint.y + length,
            };

            // Update coordinate input to reflect property changes
            setCoordinateInput({
              x: secondPoint.x,
              y: secondPoint.y,
            });

            setTempShape(
              getTempShape({
                type: 'rectangle',
                points: [basePoint, secondPoint],
              })
            );
          }
        }
        break;

      case 'circle':
        if ((propertyInput.radius || propertyInput.diameter) && step === 1) {
          let radius;
          if (propertyInput.radius) {
            radius = propertyInput.radius;
          } else {
            radius = (propertyInput.diameter || 0) / 2;
          }

          if (!isNaN(radius)) {
            // Generate a point on the circle perimeter for coordinate display
            const angle = 0; // Default to right side of circle
            const circlePoint = {
              x: basePoint.x + radius * Math.cos(angle),
              y: basePoint.y + radius * Math.sin(angle),
            };

            // Update coordinate input to reflect property changes
            setCoordinateInput({
              x: circlePoint.x,
              y: circlePoint.y,
            });

            setTempShape(
              getTempShape({
                type: 'circle',
                points: [basePoint],
                properties: { radius },
              })
            );
          }
        }
        break;

      case 'ellipse':
        if (propertyInput.radiusX && propertyInput.radiusY && step >= 1) {
          const radiusX = propertyInput.radiusX;
          const radiusY = propertyInput.radiusY;
          const rotation = (propertyInput.rotation || 0) * (Math.PI / 180);

          if (!isNaN(radiusX) && !isNaN(radiusY)) {
            // Generate a point on the ellipse perimeter for coordinate display
            const angle = rotation; // Use the rotation angle for the coordinate
            const ellipsePoint = {
              x: basePoint.x + radiusX * Math.cos(angle),
              y: basePoint.y + radiusY * Math.sin(angle),
            };

            // Update coordinate input to reflect property changes
            setCoordinateInput({
              x: ellipsePoint.x,
              y: ellipsePoint.y,
            });

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
          }
        }
        break;

      case 'polygon':
        if (propertyInput.radius && propertyInput.sides && step === 1) {
          const radius = propertyInput.radius;
          const sides = propertyInput.sides;

          if (!isNaN(radius) && !isNaN(sides)) {
            // Generate a point on the polygon perimeter for coordinate display
            const angle = 0; // Default to right side of polygon
            const polygonPoint = {
              x: basePoint.x + radius * Math.cos(angle),
              y: basePoint.y + radius * Math.sin(angle),
            };

            // Update coordinate input to reflect property changes
            setCoordinateInput({
              x: polygonPoint.x,
              y: polygonPoint.y,
            });

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
          }
        }
        break;

      case 'arc':
        if (
          propertyInput.radius &&
          propertyInput.startAngle &&
          propertyInput.endAngle &&
          step === 1
        ) {
          const radius = propertyInput.radius;
          const startAngle = propertyInput.startAngle * (Math.PI / 180);
          const endAngle = propertyInput.endAngle * (Math.PI / 180);

          if (!isNaN(radius) && !isNaN(startAngle) && !isNaN(endAngle)) {
            // Generate a point on the arc for coordinate display (use end angle)
            const arcPoint = {
              x: basePoint.x + radius * Math.cos(endAngle),
              y: basePoint.y + radius * Math.sin(endAngle),
            };

            // Update coordinate input to reflect property changes
            setCoordinateInput({
              x: arcPoint.x,
              y: arcPoint.y,
            });

            setTempShape(
              getTempShape({
                type: 'polygon',
                points: [basePoint],
                properties: {
                  radius,
                  startAngle,
                  endAngle,
                },
              })
            );
          }
        }
        break;

      default:
        break;
    }
  };

  const getInputValue = (value: number | undefined): string => {
    if (value === 0) return '';
    return value?.toString() || '';
  };

  // Get applicable property inputs for current shape and step
  const getPropertyInputs = () => {
    if (step === 0) return null;

    switch (selectedTool) {
      case 'line':
        return (
          <div className='space-y-2'>
            <Label htmlFor='length'>Length:</Label>
            <Input
              id='length'
              ref={lineLengthRef}
              value={getInputValue(propertyInput.length)}
              onChange={(e) => handleInputChange(e, 'length')}
              onKeyDown={(e) => handleKeyDown(e, 'length')}
              placeholder='Enter length'
            />
            <Label htmlFor='angle'>Angle (degrees):</Label>
            <Input
              id='angle'
              ref={lineAngleRef}
              value={getInputValue(propertyInput.angle)}
              onChange={(e) => handleInputChange(e, 'angle')}
              onKeyDown={(e) => handleKeyDown(e, 'angle')}
              placeholder='Enter angle (0-360)'
            />
          </div>
        );

      case 'rectangle':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='width'>Width:</Label>
              <Input
                id='width'
                ref={rectangleWidthRef}
                value={getInputValue(propertyInput.width)}
                onChange={(e) => handleInputChange(e, 'width')}
                onKeyDown={(e) => handleKeyDown(e, 'width')}
                placeholder='Enter width'
              />
            </div>
            <div>
              <Label htmlFor='length'>Length:</Label>
              <Input
                id='length'
                ref={rectangleLengthRef}
                value={getInputValue(propertyInput.length)}
                onChange={(e) => handleInputChange(e, 'length')}
                onKeyDown={(e) => handleKeyDown(e, 'length')}
                placeholder='Enter length'
              />
            </div>
          </div>
        );

      case 'circle':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='radius'>Radius:</Label>
              <Input
                id='radius'
                ref={circleRadiusRef}
                value={getInputValue(propertyInput.radius)}
                onChange={(e) => handleInputChange(e, 'radius')}
                onKeyDown={(e) => handleKeyDown(e, 'radius')}
                placeholder='Enter radius'
              />
            </div>
            <div>
              <Label htmlFor='diameter'>Diameter:</Label>
              <Input
                id='diameter'
                ref={circleDiameterRef}
                value={getInputValue(propertyInput.diameter)}
                onChange={(e) => handleInputChange(e, 'diameter')}
                onKeyDown={(e) => handleKeyDown(e, 'diameter')}
                placeholder='Enter diameter'
              />
            </div>
          </div>
        );

      case 'arc':
        if (step === 1) {
          return (
            <div className='space-y-4'>
              <div>
                <Label htmlFor='radius'>Radius:</Label>
                <Input
                  id='radius'
                  ref={arcRadiusRef}
                  value={getInputValue(propertyInput.radius)}
                  onChange={(e) => handleInputChange(e, 'radius')}
                  onKeyDown={(e) => handleKeyDown(e, 'radius')}
                  placeholder='Enter radius'
                />
              </div>
              <div>
                <Label htmlFor='startAngle'>Start Angle (degrees):</Label>
                <Input
                  id='startAngle'
                  ref={arcStartAngleRef}
                  value={getInputValue(propertyInput.startAngle)}
                  onChange={(e) => handleInputChange(e, 'startAngle')}
                  onKeyDown={(e) => handleKeyDown(e, 'startAngle')}
                  placeholder='Enter start angle'
                />
              </div>
              <div>
                <Label htmlFor='endAngle'>End Angle (degrees):</Label>
                <Input
                  id='endAngle'
                  ref={arcEndAngleRef}
                  value={getInputValue(propertyInput.endAngle)}
                  onChange={(e) => handleInputChange(e, 'endAngle')}
                  onKeyDown={(e) => handleKeyDown(e, 'endAngle')}
                  placeholder='Enter end angle'
                />
              </div>
            </div>
          );
        }
        return null;

      case 'polygon':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='radius'>Radius:</Label>
              <Input
                id='radius'
                ref={polygonRadiusRef}
                value={getInputValue(propertyInput.radius)}
                onChange={(e) => handleInputChange(e, 'radius')}
                onKeyDown={(e) => handleKeyDown(e, 'radius')}
                placeholder='Enter radius'
              />
            </div>
            <div>
              <Label htmlFor='sides'>Sides:</Label>
              <Input
                id='sides'
                ref={polygonSidesRef}
                value={getInputValue(propertyInput.sides)}
                onChange={(e) => handleInputChange(e, 'sides')}
                onKeyDown={(e) => handleKeyDown(e, 'sides')}
                placeholder='Enter number of sides'
              />
            </div>
          </div>
        );

      case 'ellipse':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='radiusX'>Radius X:</Label>
              <Input
                id='radiusX'
                ref={ellipseRadiusXRef}
                value={getInputValue(propertyInput.radiusX)}
                onChange={(e) => handleInputChange(e, 'radiusX')}
                onKeyDown={(e) => handleKeyDown(e, 'radiusX')}
                placeholder='Enter X radius'
              />
            </div>
            <div>
              <Label htmlFor='radiusY'>Radius Y:</Label>
              <Input
                id='radiusY'
                ref={ellipseRadiusYRef}
                value={getInputValue(propertyInput.radiusY)}
                onChange={(e) => handleInputChange(e, 'radiusY')}
                onKeyDown={(e) => handleKeyDown(e, 'radiusY')}
                placeholder='Enter Y radius'
              />
            </div>
            <div>
              <Label htmlFor='rotation'>Rotation (degrees):</Label>
              <Input
                id='rotation'
                ref={ellipseRotationRef}
                value={getInputValue(propertyInput.rotation)}
                onChange={(e) => handleInputChange(e, 'rotation')}
                onKeyDown={(e) => handleKeyDown(e, 'rotation')}
                placeholder='Enter rotation'
              />
            </div>
          </div>
        );

      case 'spline':
        if (step >= 2) {
          return (
            <div>
              <Label htmlFor='tension'>Tension:</Label>
              <Input
                id='tension'
                ref={splineTensionRef}
                value={getInputValue(propertyInput.tension)}
                onChange={(e) => handleInputChange(e, 'tension')}
                onKeyDown={(e) => handleKeyDown(e, 'tension')}
                placeholder='Enter tension (0-1)'
              />
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  // Only display when a tool is selected (not 'select')
  if (selectedTool === 'select') {
    return null;
  }

  return (
    <Card className='w-full'>
      <CardHeader className=''>
        <CardTitle className='text-lg flex items-center justify-between'>
          <span>
            {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className='h-4 w-4 text-muted-foreground' />
              </TooltipTrigger>
              <TooltipContent>
                <p>Click on canvas or enter coordinates</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className='flex items-center'>
          <div className='flex-1'>{prompt}</div>
        </CardDescription>
      </CardHeader>

      <Separator className='mb-2' />

      <CardContent>
        <div className='space-y-4'>
          {/* Coordinate inputs */}
          <div className='flex space-x-2'>
            <div className='flex-1'>
              <Label htmlFor='x'>X:</Label>
              <Input
                id='x'
                ref={xCoordinatenRef}
                value={getInputValue(coordinateInput.x)}
                onChange={(e) => handleInputChange(e, 'x')}
                onKeyDown={(e) => handleKeyDown(e, 'x')}
                placeholder='X coordinate'
              />
            </div>
            <div className='flex-1'>
              <Label htmlFor='y'>Y:</Label>
              <Input
                id='y'
                ref={yCoordinatenRef}
                value={getInputValue(coordinateInput.y)}
                onChange={(e) => handleInputChange(e, 'y')}
                onKeyDown={(e) => handleKeyDown(e, 'y')}
                placeholder='Y coordinate'
              />
            </div>
          </div>

          {/* Property-specific inputs */}
          {getPropertyInputs()}
        </div>
      </CardContent>
      <CardFooter className='flex justify-between'>
        <Button variant='outline' onClick={handleCancelDrawing}>
          Cancel (Esc)
        </Button>
        <Button onClick={handleInputConfirm}>
          {step === 0 ? 'Start' : 'Continue'}
        </Button>
      </CardFooter>
    </Card>
  );
};
