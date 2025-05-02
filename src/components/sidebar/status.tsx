'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DrawingTool } from '@/types/drawing-tool';
import { Point } from '@/types/point';
import { Shape } from '@/types/shape';
import { canvasToWorld } from '@/utils/canvasToWorld';

type Props = {
  selectedTool: DrawingTool;
  shapes: Shape[];
  mousePosition: Point | null;
  scale: number;
  offset: Point;
};

export const Status = ({
  mousePosition,
  selectedTool,
  scale,
  offset,
  shapes,
}: Props) => {
  return (
    <div>
      {/* Status and information */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-xs space-y-1'>
            <div>
              <span className='font-medium'>Active Tool:</span> {selectedTool}
            </div>
            <div>
              <span className='font-medium'>Cursor:</span>{' '}
              {mousePosition
                ? `(${canvasToWorld({ point: mousePosition, scale, offset }).x.toFixed(2)}, ${canvasToWorld({ point: mousePosition, scale, offset }).y.toFixed(2)})`
                : 'N/A'}
            </div>
            <div>
              <span className='font-medium'>Zoom:</span>{' '}
              {(scale * 100).toFixed(0)}%
            </div>
            <div>
              <span className='font-medium'>Shapes:</span> {shapes.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
