'use client';

import { useEffect, useState } from 'react';
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
import { Point } from '@/types';
import { DrawingTool } from '@/constants';

interface ShapeInputPanelProps {
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  coordinateInput: { x: string; y: string };
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
  setCoordinateInput: React.Dispatch<
    React.SetStateAction<{ x: string; y: string }>
  >;
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
  completeShape: (points: Point[], properties?: any) => void;
  handleCancelDrawing: () => void;
}

export const ShapeInputPanel = ({
  selectedTool,
  drawingPoints,
  coordinateInput,
  propertyInput,
  setCoordinateInput,
  setPropertyInput,
  completeShape,
  handleCancelDrawing,
}: ShapeInputPanelProps) => {
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState('');

  // Reset step when tool changes
  useEffect(() => {
    setStep(0);
  }, [selectedTool]);

  // Update step based on drawing points
  useEffect(() => {
    setStep(drawingPoints.length);
  }, [drawingPoints]);

  // Handle coordinate input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    if (field === 'x' || field === 'y') {
      setCoordinateInput((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    } else {
      setPropertyInput((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    }
  };

  // Handle Enter key press
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputConfirm();
    }
  };

  // Handle input confirmation
  const handleInputConfirm = () => {
    // Handle coordinate input
    if (coordinateInput.x && coordinateInput.y) {
      const point: Point = {
        x: parseFloat(coordinateInput.x),
        y: parseFloat(coordinateInput.y),
      };

      if (step === 0) {
        // First point
        const newPoints = [point];

        if (selectedTool === 'text') {
          // Complete text with a single point
          completeShape(newPoints);
          setStep(0);
        } else {
          // Add first point for other shapes
          setStep(1);
        }
      } else {
        // Process based on shape type
        processShapeCompletion(point);
      }

      // Reset coordinate input
      setCoordinateInput({ x: '', y: '' });
    }
    // Handle property input (for certain shapes)
    else if (isPropertyInputValid()) {
      processPropertyInput();
    }
  };

  // Check if property input is valid
  const isPropertyInputValid = () => {
    switch (selectedTool) {
      case 'rectangle':
        return propertyInput.width && propertyInput.height;
      case 'circle':
        return propertyInput.radius || propertyInput.diameter;
      case 'polygon':
        return propertyInput.radius && propertyInput.sides;
      case 'ellipse':
        return propertyInput.radiusX && propertyInput.radiusY;
      default:
        return false;
    }
  };

  // Process shape completion based on coordinates
  const processShapeCompletion = (point: Point) => {
    switch (selectedTool) {
      case 'line':
        completeShape([drawingPoints[0], point]);
        setStep(0);
        break;

      case 'polyline':
        const updatedPoints = [...drawingPoints, point];
        // Check if we're ending the polyline (e.g., closed the shape)
        const isClosing = false; // You can implement a check here
        if (isClosing) {
          completeShape(updatedPoints);
          setStep(0);
        } else {
          // Just continue adding points
          setStep(step + 1);
        }
        break;

      case 'rectangle':
        completeShape([drawingPoints[0], point]);
        setStep(0);
        break;

      case 'circle':
        // For circle, second point determines radius
        completeShape([drawingPoints[0]], {
          radius: Math.hypot(
            point.x - drawingPoints[0].x,
            point.y - drawingPoints[0].y
          ),
        });
        setStep(0);
        break;

      case 'arc':
        // For 3-point arc
        if (step === 1) {
          setStep(2);
        } else if (step === 2) {
          completeShape([drawingPoints[0], drawingPoints[1], point]);
          setStep(0);
        }
        break;

      case 'ellipse':
        if (step === 1) {
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

          completeShape([drawingPoints[0]], { radiusX, radiusY });
          setStep(0);
        }
        break;

      case 'polygon':
        // For polygon, second point determines radius
        completeShape([drawingPoints[0]], {
          radius: Math.hypot(
            point.x - drawingPoints[0].x,
            point.y - drawingPoints[0].y
          ),
          sides: parseInt(propertyInput.sides || '6'),
        });
        setStep(0);
        break;

      case 'spline':
        const splinePoints = [...drawingPoints, point];
        if (splinePoints.length >= 3) {
          completeShape(splinePoints, {
            tension: parseFloat(propertyInput.tension || '0.5'),
          });
          setStep(0);
        } else {
          setStep(step + 1);
        }
        break;

      case 'dimension':
        if (step === 1) {
          completeShape([drawingPoints[0], point]);
          setStep(0);
        }
        break;

      default:
        break;
    }
  };

  // Process property-based shape completion
  const processPropertyInput = () => {
    if (drawingPoints.length === 0) return;

    const basePoint = drawingPoints[0];

    switch (selectedTool) {
      case 'rectangle':
        // Create rectangle using width and height
        const width = parseFloat(propertyInput.width);
        const height = parseFloat(propertyInput.height);

        const secondPoint = {
          x: basePoint.x + width,
          y: basePoint.y + height,
        };

        completeShape([basePoint, secondPoint]);
        break;

      case 'circle':
        // Create circle using radius or diameter
        let radius;
        if (propertyInput.radius) {
          radius = parseFloat(propertyInput.radius);
        } else if (propertyInput.diameter) {
          radius = parseFloat(propertyInput.diameter) / 2;
        }

        if (radius) {
          completeShape([basePoint], { radius });
        }
        break;

      case 'ellipse':
        // Create ellipse using radiusX and radiusY
        const radiusX = parseFloat(propertyInput.radiusX);
        const radiusY = parseFloat(propertyInput.radiusY);
        const rotation = parseFloat(propertyInput.rotation || '0');

        completeShape([basePoint], {
          radiusX,
          radiusY,
          rotation: rotation * (Math.PI / 180),
          isFullEllipse: true,
        });
        break;

      case 'polygon':
        // Create polygon using radius and sides
        const polygonRadius = parseFloat(propertyInput.radius);
        const sides = parseInt(propertyInput.sides || '6');

        completeShape([basePoint], { radius: polygonRadius, sides });
        break;

      default:
        break;
    }

    // Reset property inputs
    setPropertyInput({
      length: '',
      width: '',
      height: '',
      radius: '',
      diameter: '',
      direction: '',
      radiusX: '',
      radiusY: '',
      startAngle: '',
      endAngle: '',
      sides: propertyInput.sides || '6',
      rotation: '',
      tension: propertyInput.tension || '0.5',
    });

    setStep(0);
  };

  // Generate prompt based on tool and step
  useEffect(() => {
    generatePrompt();
  }, [selectedTool, step]);

  const generatePrompt = () => {
    switch (selectedTool) {
      case 'line':
        setPrompt(
          step === 0
            ? 'Specify first point:'
            : 'Specify second point or [Length]:'
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
        else if (step === 1) setPrompt('Specify second point:');
        else setPrompt('Specify end point:');
        break;

      case 'ellipse':
        if (step === 0) setPrompt('Specify center point:');
        else if (step === 1) setPrompt('Specify first axis endpoint:');
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
        else setPrompt(`Specify next point or [Close/Undo]:`);
        break;

      case 'text':
        setPrompt('Specify insertion point:');
        break;

      case 'dimension':
        setPrompt(
          step === 0
            ? 'Specify first extension line origin:'
            : 'Specify second extension line origin:'
        );
        break;

      default:
        setPrompt('Select a drawing tool');
        break;
    }
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
              value={propertyInput.length}
              onChange={(e) => handleInputChange(e, 'length')}
              onKeyDown={(e) => handleKeyDown(e, 'length')}
              placeholder='Enter length'
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
                value={propertyInput.width}
                onChange={(e) => handleInputChange(e, 'width')}
                onKeyDown={(e) => handleKeyDown(e, 'width')}
                placeholder='Enter width'
              />
            </div>
            <div>
              <Label htmlFor='height'>Height:</Label>
              <Input
                id='height'
                value={propertyInput.height}
                onChange={(e) => handleInputChange(e, 'height')}
                onKeyDown={(e) => handleKeyDown(e, 'height')}
                placeholder='Enter height'
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
                value={propertyInput.radius}
                onChange={(e) => handleInputChange(e, 'radius')}
                onKeyDown={(e) => handleKeyDown(e, 'radius')}
                placeholder='Enter radius'
              />
            </div>
            <div>
              <Label htmlFor='diameter'>Diameter:</Label>
              <Input
                id='diameter'
                value={propertyInput.diameter}
                onChange={(e) => handleInputChange(e, 'diameter')}
                onKeyDown={(e) => handleKeyDown(e, 'diameter')}
                placeholder='Enter diameter'
              />
            </div>
          </div>
        );

      case 'polygon':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='radius'>Radius:</Label>
              <Input
                id='radius'
                value={propertyInput.radius}
                onChange={(e) => handleInputChange(e, 'radius')}
                onKeyDown={(e) => handleKeyDown(e, 'radius')}
                placeholder='Enter radius'
              />
            </div>
            <div>
              <Label htmlFor='sides'>Sides:</Label>
              <Input
                id='sides'
                value={propertyInput.sides}
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
                value={propertyInput.radiusX}
                onChange={(e) => handleInputChange(e, 'radiusX')}
                onKeyDown={(e) => handleKeyDown(e, 'radiusX')}
                placeholder='Enter X radius'
              />
            </div>
            <div>
              <Label htmlFor='radiusY'>Radius Y:</Label>
              <Input
                id='radiusY'
                value={propertyInput.radiusY}
                onChange={(e) => handleInputChange(e, 'radiusY')}
                onKeyDown={(e) => handleKeyDown(e, 'radiusY')}
                placeholder='Enter Y radius'
              />
            </div>
            <div>
              <Label htmlFor='rotation'>Rotation (degrees):</Label>
              <Input
                id='rotation'
                value={propertyInput.rotation}
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
                value={propertyInput.tension}
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
      <CardHeader>
        <CardTitle className='text-lg'>
          Drawing {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}
        </CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Coordinate inputs */}
          <div className='flex space-x-2'>
            <div className='flex-1'>
              <Label htmlFor='x'>X:</Label>
              <Input
                id='x'
                value={coordinateInput.x}
                onChange={(e) => handleInputChange(e, 'x')}
                onKeyDown={(e) => handleKeyDown(e, 'x')}
                placeholder='X coordinate'
              />
            </div>
            <div className='flex-1'>
              <Label htmlFor='y'>Y:</Label>
              <Input
                id='y'
                value={coordinateInput.y}
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
          Cancel
        </Button>
        <Button onClick={handleInputConfirm}>
          {step === 0 ? 'Start' : 'Continue'}
        </Button>
      </CardFooter>
    </Card>
  );
};
