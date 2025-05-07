'use client';

import { canvasToWorld } from '@/utils/canvasToWorld';
import { Point } from '@/types';
import { DrawingTool } from '@/constants';

type StatusBarProps = {
  selectedTool: DrawingTool;
  mousePosition: Point | null;
  scale: number;
  offset: Point;
};

export const StatusBar = ({
  selectedTool,
  mousePosition,
  scale,
  offset,
}: StatusBarProps) => {
  return (
    <div className='w-full mt-2 bg-muted/40 rounded-md p-2 text-xs'>
      <div className='grid grid-cols-1 gap-y-1'>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground'>Tool:</span>
          <span className='font-medium capitalize'>{selectedTool}</span>
        </div>

        <div className='w-full h-px bg-border/50' />

        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground'>Position:</span>
          <span className='font-medium text-right'>
            {mousePosition
              ? `(${canvasToWorld({ point: mousePosition, scale, offset }).x.toFixed(2)}, ${canvasToWorld({ point: mousePosition, scale, offset }).y.toFixed(2)})`
              : '(0.00, 0.00)'}
          </span>
        </div>

        <div className='w-full h-px bg-border/50' />

        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground'>Zoom:</span>
          <span className='font-medium'>{(scale * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
