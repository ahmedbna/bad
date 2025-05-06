'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DrawingTool } from '@/types/drawing-tool';
import { Shape } from '@/types';

type Props = {
  selectedTool: DrawingTool;
  selectedShapes: string[];
  shapes: Shape[];
};

export const SelectedProperties = ({
  selectedTool,
  selectedShapes,
  shapes,
}: Props) => {
  return (
    <div>
      {/* Selected shape properties */}
      {selectedTool === 'select' && selectedShapes.length > 0 && (
        <Card className='mb-4'>
          <CardHeader className='py-2'>
            <CardTitle className='text-sm'>Selected Shape</CardTitle>
          </CardHeader>
          <CardContent>
            {/* {shapes.find((s) => s.id === selectedShape)?.type && (
              <div className='text-sm space-y-2'>
                <div>
                  <span className='font-medium'>Type:</span>{' '}
                  {shapes.find((s) => s.id === selectedShape)?.type}
                </div>

                {shapes.find((s) => s.id === selectedShape)?.points && (
                  <div>
                    <span className='font-medium'>Points:</span>
                    <div className='pl-2 text-xs'>
                      {shapes
                        .find((s) => s.id === selectedShape)
                        ?.points.map((point, index) => (
                          <div key={index}>
                            Point {index + 1}: ({point.x.toFixed(2)},{' '}
                            {point.y.toFixed(2)})
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {shapes.find((s) => s.id === selectedShape)?.properties
                  ?.radius && (
                  <div>
                    <span className='font-medium'>Radius:</span>{' '}
                    {shapes
                      .find((s) => s.id === selectedShape)
                      ?.properties?.radius?.toFixed(2) ?? 'N/A'}
                  </div>
                )}
              </div>
            )} */}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
