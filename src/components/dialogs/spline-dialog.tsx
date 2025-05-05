'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

type Props = {
  showSplineDialog: boolean;
  splineTension: number;
  setShowSplineDialog: (show: boolean) => void;
  setSplineTension: React.Dispatch<React.SetStateAction<number>>;
};

export const SplineDialog = ({
  splineTension,
  showSplineDialog,
  setShowSplineDialog,
  setSplineTension,
}: Props) => {
  return (
    <Dialog open={showSplineDialog} onOpenChange={setShowSplineDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spline Settings</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='tension' className='text-right'>
              Tension
            </Label>
            <div className='col-span-3 flex items-center gap-2'>
              <Slider
                id='tension'
                min={0}
                max={1}
                step={0.1}
                value={[splineTension]}
                onValueChange={(value) => setSplineTension(value[0])}
              />
              <span>{splineTension.toFixed(1)}</span>
            </div>
          </div>
          <p className='text-sm text-muted-foreground'>
            Note: Double-click to complete the spline after adding at least 3
            points.
          </p>
        </div>
        <DialogFooter>
          <Button type='submit' onClick={() => setShowSplineDialog(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
