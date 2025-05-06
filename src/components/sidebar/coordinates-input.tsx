'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DrawingTool } from '@/types/drawing-tool';
import { Point } from '@/types/point';
import { Shape } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  coordinateInput: { x: string; y: string };
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  tempShape: Shape | null;
  setCoordinateInput: React.Dispatch<
    React.SetStateAction<{ x: string; y: string }>
  >;
  setDrawingPoints: (points: Point[]) => void;
  setTempShape: (shape: Shape | null) => void;
  completeShape: (points: Point[], properties?: any) => void;
};

export const CoordinatesInput = ({
  coordinateInput,
  selectedTool,
  tempShape,
  drawingPoints,
  setDrawingPoints,
  setTempShape,
  setCoordinateInput,
  completeShape,
}: Props) => {
  // Handle coordinate input
  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (coordinateInput.x === '' || coordinateInput.y === '') return;

    const point = {
      x: parseFloat(coordinateInput.x),
      y: parseFloat(coordinateInput.y),
    };

    if (isNaN(point.x) || isNaN(point.y)) return;

    // Use the input coordinates as a point
    if (drawingPoints.length === 0) {
      // First point
      setDrawingPoints([point]);

      // Create temporary shape
      const newTempShape: Shape = {
        id: `temp-${Date.now()}`,
        type: selectedTool,
        points: [point],
        properties: {},
      };

      setTempShape(newTempShape);
    } else {
      // Complete shapes based on the tool
      switch (selectedTool) {
        case 'line':
        case 'rectangle':
          completeShape([drawingPoints[0], point]);
          break;

        case 'circle':
          // For circle, the second point just helps compute radius
          const center = drawingPoints[0];
          const dx = point.x - center.x;
          const dy = point.y - center.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          completeShape([center], { radius });
          break;

        case 'polyline':
          // Add point to polyline
          const updatedPoints = [...drawingPoints, point];
          setDrawingPoints(updatedPoints);

          // Update temp shape with new point
          if (tempShape) {
            setTempShape({
              ...tempShape,
              points: updatedPoints,
            });
          }
          break;

        default:
          break;
      }
    }
  };

  // Complete shape and add to shapes list
  // const completeShape = (points: Point[], properties = {}) => {
  //   if (points.length < 1) return;

  //   const newShape: Shape = {
  //     id: `shape-${Date.now()}`,
  //     type: selectedTool,
  //     points,
  //     properties,
  //   };

  //   setShapes((prev) => [...prev, newShape]);
  //   setDrawingPoints([]);
  //   setTempShape(null);
  //   setCoordinateInput({ x: '', y: '' });
  //   setPropertyInput({
  //     length: '',
  //     width: '',
  //     height: '',
  //     radius: '',
  //     diameter: '',
  //   });
  // };

  return (
    <div>
      {/* Coordinate input */}
      {selectedTool !== 'select' && (
        <Card className='mb-4'>
          <CardHeader className='py-2'>
            <CardTitle className='text-sm'>Coordinates</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCoordinateSubmit} className='space-y-2'>
              <div className='grid grid-cols-2 gap-2'>
                <div className='flex flex-col space-y-1'>
                  <Label htmlFor='coord-x' className='text-xs'>
                    X:
                  </Label>
                  <Input
                    id='coord-x'
                    value={coordinateInput.x}
                    onChange={(e) =>
                      setCoordinateInput((prev) => ({
                        ...prev,
                        x: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className='flex flex-col space-y-1'>
                  <Label htmlFor='coord-y' className='text-xs'>
                    Y:
                  </Label>
                  <Input
                    id='coord-y'
                    value={coordinateInput.y}
                    onChange={(e) =>
                      setCoordinateInput((prev) => ({
                        ...prev,
                        y: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button type='submit' size='sm' className='w-full'>
                Set Point
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
