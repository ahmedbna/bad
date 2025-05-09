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
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface ShapeInputPanelProps {
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  completeShape: (points: Point[], properties?: any) => void;
  handleCancelDrawing: () => void;
}

export const ShapeInputPanel = ({
  selectedTool,
  drawingPoints,
  completeShape,
  handleCancelDrawing,
}: ShapeInputPanelProps) => {
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [activeProperty, setActiveProperty] = useState<string | null>(null);

  // Reset step when tool changes
  useEffect(() => {
    setStep(0);
    setActiveProperty(null);
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

      // Handle special cases where one input should update another
      if (field === 'radius' && e.target.value) {
        // Update diameter when radius changes
        const radiusValue = parseFloat(e.target.value);
        if (!isNaN(radiusValue)) {
          setPropertyInput((prev) => ({
            ...prev,
            diameter: (radiusValue * 2).toString(),
          }));
        }
      } else if (field === 'diameter' && e.target.value) {
        // Update radius when diameter changes
        const diameterValue = parseFloat(e.target.value);
        if (!isNaN(diameterValue)) {
          setPropertyInput((prev) => ({
            ...prev,
            radius: (diameterValue / 2).toString(),
          }));
        }
      }
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
    } else if (e.key === 'Escape') {
      handleCancelDrawing();
    }
  };

  // Handle property selection (when user types a property shortcut)
  const handlePropertySelection = (property: string) => {
    setActiveProperty(property);
  };

  // Handle input confirmation
  const handleInputConfirm = () => {
    // If a property is active, process that property input
    if (activeProperty) {
      processPropertyInput();
      setActiveProperty(null);
      return;
    }

    // Handle coordinate input
    if (coordinateInput.x && coordinateInput.y) {
      const point: Point = {
        x: parseFloat(coordinateInput.x),
        y: parseFloat(coordinateInput.y),
      };

      if (!isNaN(point.x) && !isNaN(point.y)) {
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
      case 'line':
        return propertyInput.length && step === 1;
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
          setStep(2);
        } else if (step === 2) {
          completeShape([drawingPoints[0], drawingPoints[1], point]);
          setStep(0);
        }
        break;

      default:
        break;
    }
  };

  // Process property-based shape completion
  const processPropertyInput = () => {
    if (drawingPoints.length === 0 && selectedTool !== 'text') return;

    const basePoint = drawingPoints[0] || { x: 0, y: 0 };

    switch (selectedTool) {
      case 'line':
        if (propertyInput.length && step === 1) {
          const length = parseFloat(propertyInput.length);
          const direction = propertyInput.direction
            ? parseFloat(propertyInput.direction) * (Math.PI / 180) // Convert degrees to radians
            : 0; // Default direction is horizontal (0 degrees)

          const secondPoint = {
            x: basePoint.x + length * Math.cos(direction),
            y: basePoint.y + length * Math.sin(direction),
          };

          completeShape([basePoint, secondPoint]);
          setStep(0);
        }
        break;

      case 'rectangle':
        // Create rectangle using width and height
        const width = parseFloat(propertyInput.width);
        const height = parseFloat(propertyInput.height);

        if (!isNaN(width) && !isNaN(height)) {
          const secondPoint = {
            x: basePoint.x + width,
            y: basePoint.y + height,
          };

          completeShape([basePoint, secondPoint]);
          setStep(0);
        }
        break;

      case 'circle':
        // Create circle using radius or diameter
        let radius;
        if (propertyInput.radius) {
          radius = parseFloat(propertyInput.radius);
        } else if (propertyInput.diameter) {
          radius = parseFloat(propertyInput.diameter) / 2;
        }

        if (radius && !isNaN(radius)) {
          completeShape([basePoint], { radius });
          setStep(0);
        }
        break;

      case 'ellipse':
        // Create ellipse using radiusX and radiusY
        const radiusX = parseFloat(propertyInput.radiusX);
        const radiusY = parseFloat(propertyInput.radiusY);
        const rotation = parseFloat(propertyInput.rotation || '0');

        if (!isNaN(radiusX) && !isNaN(radiusY)) {
          completeShape([basePoint], {
            radiusX,
            radiusY,
            rotation: rotation * (Math.PI / 180),
            isFullEllipse: true,
          });
          setStep(0);
        }
        break;

      case 'polygon':
        // Create polygon using radius and sides
        const polygonRadius = parseFloat(propertyInput.radius);
        const sides = parseInt(propertyInput.sides || '6');

        if (!isNaN(polygonRadius) && !isNaN(sides)) {
          completeShape([basePoint], { radius: polygonRadius, sides });
          setStep(0);
        }
        break;

      case 'arc':
        if (
          step === 1 &&
          propertyInput.radius &&
          propertyInput.startAngle &&
          propertyInput.endAngle
        ) {
          const arcRadius = parseFloat(propertyInput.radius);
          const startAngle =
            parseFloat(propertyInput.startAngle) * (Math.PI / 180);
          const endAngle = parseFloat(propertyInput.endAngle) * (Math.PI / 180);

          if (!isNaN(arcRadius) && !isNaN(startAngle) && !isNaN(endAngle)) {
            completeShape([basePoint], {
              radius: arcRadius,
              startAngle,
              endAngle,
            });
            setStep(0);
          }
        }
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

    setActiveProperty(null);
  };

  // Generate prompt based on tool and step
  useEffect(() => {
    generatePrompt();
  }, [selectedTool, step, activeProperty]);

  const generatePrompt = () => {
    // If a property is active, show its prompt
    if (activeProperty) {
      switch (activeProperty) {
        case 'width':
          setPrompt('Specify width:');
          return;
        case 'height':
          setPrompt('Specify height:');
          return;
        case 'length':
          setPrompt('Specify length:');
          return;
        case 'direction':
          setPrompt('Specify direction angle (degrees):');
          return;
        case 'radius':
          setPrompt('Specify radius:');
          return;
        case 'diameter':
          setPrompt('Specify diameter:');
          return;
        case 'sides':
          setPrompt('Specify number of sides:');
          return;
        case 'radiusX':
          setPrompt('Specify X radius:');
          return;
        case 'radiusY':
          setPrompt('Specify Y radius:');
          return;
        case 'rotation':
          setPrompt('Specify rotation angle (degrees):');
          return;
        case 'startAngle':
          setPrompt('Specify start angle (degrees):');
          return;
        case 'endAngle':
          setPrompt('Specify end angle (degrees):');
          return;
        case 'tension':
          setPrompt('Specify spline tension (0-1):');
          return;
        default:
          break;
      }
    }

    // Otherwise show the step prompt
    switch (selectedTool) {
      case 'line':
        setPrompt(
          step === 0
            ? 'Specify first point:'
            : 'Specify second point or [Length/Direction]:'
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

  // Get available options (shown in brackets in the prompt)
  const getOptionsForPrompt = () => {
    switch (selectedTool) {
      case 'line':
        if (step === 1) return ['Length', 'Direction'];
        return [];
      case 'polyline':
        if (step >= 1) return ['Close', 'Undo'];
        return [];
      case 'rectangle':
        if (step === 1) return ['Width', 'Height'];
        return [];
      case 'circle':
        if (step === 1) return ['Diameter'];
        return [];
      case 'arc':
        if (step === 1) return ['Radius', 'StartAngle', 'EndAngle'];
        return [];
      case 'ellipse':
        if (step === 1) return ['RadiusX', 'RadiusY', 'Rotation'];
        return [];
      case 'polygon':
        if (step === 1) return ['Sides'];
        return [];
      case 'spline':
        if (step >= 2) return ['Close', 'Undo', 'Tension'];
        return [];
      default:
        return [];
    }
  };

  // Get applicable property inputs for current shape and step
  const getPropertyInputs = () => {
    // Don't show any property inputs if a specific property is active
    if (activeProperty) {
      return (
        <div className='space-y-2'>
          <Label htmlFor={activeProperty}>
            {activeProperty.charAt(0).toUpperCase() + activeProperty.slice(1)}:
          </Label>
          <Input
            id={activeProperty}
            value={
              propertyInput[activeProperty as keyof typeof propertyInput] || ''
            }
            onChange={(e) => handleInputChange(e, activeProperty)}
            onKeyDown={(e) => handleKeyDown(e, activeProperty)}
            placeholder={`Enter ${activeProperty}`}
            autoFocus
          />
        </div>
      );
    }

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
            <Label htmlFor='direction'>Direction (degrees):</Label>
            <Input
              id='direction'
              value={propertyInput.direction}
              onChange={(e) => handleInputChange(e, 'direction')}
              onKeyDown={(e) => handleKeyDown(e, 'direction')}
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

      case 'arc':
        if (step === 1) {
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
                <Label htmlFor='startAngle'>Start Angle (degrees):</Label>
                <Input
                  id='startAngle'
                  value={propertyInput.startAngle}
                  onChange={(e) => handleInputChange(e, 'startAngle')}
                  onKeyDown={(e) => handleKeyDown(e, 'startAngle')}
                  placeholder='Enter start angle'
                />
              </div>
              <div>
                <Label htmlFor='endAngle'>End Angle (degrees):</Label>
                <Input
                  id='endAngle'
                  value={propertyInput.endAngle}
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
      <CardHeader className='pb-3'>
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

        {/* Option buttons for step-specific choices */}
        {getOptionsForPrompt().length > 0 && (
          <div className='flex flex-wrap gap-1 mt-2'>
            {getOptionsForPrompt().map((option) => (
              <Button
                key={option}
                variant='outline'
                size='sm'
                onClick={() => handlePropertySelection(option.toLowerCase())}
                className='text-xs px-2 py-0 h-7'
              >
                {option}
              </Button>
            ))}
          </div>
        )}
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
          Cancel (Esc)
        </Button>
        <Button onClick={handleInputConfirm}>
          {step === 0 ? 'Start' : activeProperty ? 'Apply' : 'Continue'}
        </Button>
      </CardFooter>
    </Card>
  );
};
