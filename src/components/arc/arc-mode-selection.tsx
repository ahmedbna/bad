'use client';

import { Spline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { ArcMode } from '@/types/arc-mode';

type Props = {
  showArcMode: boolean;
  setShowArcMode: (show: boolean) => void;
  setArcMode: (mode: ArcMode) => void;
};

export const ArcModeSelection = ({
  showArcMode,
  setShowArcMode,
  setArcMode,
}: Props) => {
  return (
    <Dialog open={showArcMode} onOpenChange={setShowArcMode}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spline Settings</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <Button
            variant='outline'
            className='flex items-center space-x-2'
            onClick={() => {
              setArcMode('ThreePoint');
              setShowArcMode(false);
            }}
          >
            <Spline className='w-4 h-4' />
            <span>Three Point</span>
          </Button>
          <Button
            variant='outline'
            className='flex items-center space-x-2'
            onClick={() => {
              setArcMode('StartCenterEnd');
              setShowArcMode(false);
            }}
          >
            <Spline className='w-4 h-4' />
            <span>Start, Center, End</span>
          </Button>

          <Button
            variant='outline'
            className='flex items-center space-x-2'
            onClick={() => {
              setArcMode('CenterStartEnd');
              setShowArcMode(false);
            }}
          >
            <Spline className='w-4 h-4' />
            <span>Center, Start, End</span>
          </Button>
          <Button
            variant='outline'
            className='flex items-center space-x-2'
            onClick={() => {
              setArcMode('StartEndRadius');
              setShowArcMode(false);
            }}
          >
            <Spline className='w-4 h-4' />
            <span>Start, End, Radius</span>
          </Button>
          <Button
            variant='outline'
            className='flex items-center space-x-2'
            onClick={() => {
              setArcMode('StartEndDirection');
              setShowArcMode(false);
            }}
          >
            <Spline className='w-4 h-4' />
            <span>Start, End, Direction</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
