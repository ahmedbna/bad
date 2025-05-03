'use client';

// Arc drawing modes
type ArcMode =
  | 'ThreePoint'
  | 'StartCenterEnd'
  | 'CenterStartEnd'
  | 'StartEndRadius'
  | 'StartEndDirection';

import { useState } from 'react';

export const ArcDrawingInstructions: React.FC = () => {
  const [arcMode, setArcMode] = useState<ArcMode>('ThreePoint');

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex space-x-2'>
        <div className='border-l pl-4 flex-1'>
          <h3 className='font-medium mb-2'>Drawing Instructions</h3>
          {arcMode === 'ThreePoint' && (
            <div className='text-sm space-y-1'>
              <p>
                <span className='font-semibold'>Step 1:</span> Click to specify
                start point
              </p>
              <p>
                <span className='font-semibold'>Step 2:</span> Click to specify
                a point the arc passes through
              </p>
              <p>
                <span className='font-semibold'>Step 3:</span> Click to specify
                end point
              </p>
            </div>
          )}
          {arcMode === 'StartCenterEnd' && (
            <div className='text-sm space-y-1'>
              <p>
                <span className='font-semibold'>Step 1:</span> Click to specify
                start point
              </p>
              <p>
                <span className='font-semibold'>Step 2:</span> Click to specify
                center point
              </p>
              <p>
                <span className='font-semibold'>Step 3:</span> Click to specify
                end point
              </p>
            </div>
          )}
          {arcMode === 'CenterStartEnd' && (
            <div className='text-sm space-y-1'>
              <p>
                <span className='font-semibold'>Step 1:</span> Click to specify
                center point
              </p>
              <p>
                <span className='font-semibold'>Step 2:</span> Click to specify
                start point
              </p>
              <p>
                <span className='font-semibold'>Step 3:</span> Click to specify
                end point
              </p>
            </div>
          )}
          {arcMode === 'StartEndRadius' && (
            <div className='text-sm space-y-1'>
              <p>
                <span className='font-semibold'>Step 1:</span> Click to specify
                start point
              </p>
              <p>
                <span className='font-semibold'>Step 2:</span> Click to specify
                end point
              </p>
              <p>
                <span className='font-semibold'>Step 3:</span> Click to specify
                bulge direction or enter radius
              </p>
            </div>
          )}
          {arcMode === 'StartEndDirection' && (
            <div className='text-sm space-y-1'>
              <p>
                <span className='font-semibold'>Step 1:</span> Click to specify
                start point
              </p>
              <p>
                <span className='font-semibold'>Step 2:</span> Click to specify
                end point
              </p>
              <p>
                <span className='font-semibold'>Step 3:</span> Click to specify
                start direction or enter angle
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
