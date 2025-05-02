'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Point } from '@/types/point';
import { DrawingTool } from '@/types/drawing-tool';
import { Property } from '@/types/property';

type Props = {
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  propertyInput: Property;
  setPropertyInput: React.Dispatch<React.SetStateAction<Property>>;
  handleCancelDrawing: () => void;
  completeShape: (points: Point[], properties?: any) => void;
};

export const Properties = ({
  selectedTool,
  drawingPoints,
  propertyInput,
  setPropertyInput,
  handleCancelDrawing,
  completeShape,
}: Props) => {
  // Handle property input
  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (drawingPoints.length === 0) return;

    switch (selectedTool) {
      case 'line':
        if (propertyInput.length === '') return;

        const length = parseFloat(propertyInput.length);
        if (isNaN(length)) return;

        // Calculate second point based on first point and length
        // Assuming horizontal line for simplicity
        const lineEnd = {
          x: drawingPoints[0].x + length,
          y: drawingPoints[0].y,
        };

        completeShape([drawingPoints[0], lineEnd]);
        break;

      case 'rectangle':
        if (propertyInput.width === '' || propertyInput.height === '') return;

        const width = parseFloat(propertyInput.width);
        const height = parseFloat(propertyInput.height);

        if (isNaN(width) || isNaN(height)) return;

        // Calculate second point based on first point, width, and height
        const rectEnd = {
          x: drawingPoints[0].x + width,
          y: drawingPoints[0].y + height,
        };

        completeShape([drawingPoints[0], rectEnd]);
        break;

      case 'circle':
        let radius = 0;

        if (propertyInput.radius !== '') {
          radius = parseFloat(propertyInput.radius);
        } else if (propertyInput.diameter !== '') {
          radius = parseFloat(propertyInput.diameter) / 2;
        } else {
          return;
        }

        if (isNaN(radius)) return;

        completeShape([drawingPoints[0]], { radius });
        break;

      default:
        break;
    }
  };

  return (
    <div>
      {/* Tool-specific properties */}
      {selectedTool !== 'select' && drawingPoints.length > 0 && (
        <Card className='mb-4'>
          <CardHeader className='py-2'>
            <CardTitle className='text-sm'>
              {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}{' '}
              Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePropertySubmit} className='space-y-2'>
              {selectedTool === 'line' && (
                <div className='flex flex-col space-y-1'>
                  <Label htmlFor='prop-length' className='text-xs'>
                    Length:
                  </Label>
                  <Input
                    id='prop-length'
                    value={propertyInput.length}
                    onChange={(e) =>
                      setPropertyInput((prev) => ({
                        ...prev,
                        length: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {selectedTool === 'rectangle' && (
                <>
                  <div className='flex flex-col space-y-1'>
                    <Label htmlFor='prop-width' className='text-xs'>
                      Width:
                    </Label>
                    <Input
                      id='prop-width'
                      value={propertyInput.width}
                      onChange={(e) =>
                        setPropertyInput((prev) => ({
                          ...prev,
                          width: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='flex flex-col space-y-1'>
                    <Label htmlFor='prop-height' className='text-xs'>
                      Height:
                    </Label>
                    <Input
                      id='prop-height'
                      value={propertyInput.height}
                      onChange={(e) =>
                        setPropertyInput((prev) => ({
                          ...prev,
                          height: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

              {selectedTool === 'circle' && (
                <Tabs defaultValue='radius'>
                  <TabsList className='w-full grid grid-cols-2'>
                    <TabsTrigger value='radius'>Radius</TabsTrigger>
                    <TabsTrigger value='diameter'>Diameter</TabsTrigger>
                  </TabsList>
                  <TabsContent value='radius'>
                    <div className='flex flex-col space-y-1'>
                      <Label htmlFor='prop-radius' className='text-xs'>
                        Radius:
                      </Label>
                      <Input
                        id='prop-radius'
                        value={propertyInput.radius}
                        onChange={(e) =>
                          setPropertyInput((prev) => ({
                            ...prev,
                            radius: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value='diameter'>
                    <div className='flex flex-col space-y-1'>
                      <Label htmlFor='prop-diameter' className='text-xs'>
                        Diameter:
                      </Label>
                      <Input
                        id='prop-diameter'
                        value={propertyInput.diameter}
                        onChange={(e) =>
                          setPropertyInput((prev) => ({
                            ...prev,
                            diameter: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {selectedTool === 'polyline' && (
                <div className='text-xs'>
                  Points: {drawingPoints.length}
                  <p className='mt-1 text-gray-500'>
                    Double-click to finish polyline
                  </p>
                </div>
              )}

              <div className='flex space-x-2 pt-1'>
                <Button type='submit' size='sm' className='flex-1'>
                  Apply
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='flex-1'
                  onClick={handleCancelDrawing}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
