'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EllipseParams {
  radiusX: number;
  radiusY: number;
  rotation: number;
  isFullEllipse: boolean;
}

type Props = {
  showEllipseDialog: boolean;
  ellipseParams: EllipseParams;
  setShowEllipseDialog: (show: boolean) => void;
  setEllipseParams: React.Dispatch<React.SetStateAction<EllipseParams>>;
};

export const EllipseDialog = ({
  showEllipseDialog,
  setShowEllipseDialog,
  ellipseParams,
  setEllipseParams,
}: Props) => {
  return (
    <Dialog open={showEllipseDialog} onOpenChange={setShowEllipseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ellipse Settings</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='radiusX' className='text-right'>
              X Radius
            </Label>
            <Input
              id='radiusX'
              type='number'
              min='1'
              value={ellipseParams.radiusX}
              onChange={(e) =>
                setEllipseParams((prev) => ({
                  ...prev,
                  radiusX: parseInt(e.target.value, 10),
                }))
              }
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='radiusY' className='text-right'>
              Y Radius
            </Label>
            <Input
              id='radiusY'
              type='number'
              min='1'
              value={ellipseParams.radiusY}
              onChange={(e) =>
                setEllipseParams((prev) => ({
                  ...prev,
                  radiusY: parseInt(e.target.value, 10),
                }))
              }
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='rotation' className='text-right'>
              Rotation (degrees)
            </Label>
            <Input
              id='rotation'
              type='number'
              min='0'
              max='360'
              value={Math.round((ellipseParams.rotation * 180) / Math.PI)}
              onChange={(e) =>
                setEllipseParams((prev) => ({
                  ...prev,
                  rotation: (parseInt(e.target.value, 10) * Math.PI) / 180,
                }))
              }
              className='col-span-3'
            />
          </div>
        </div>
        <DialogFooter>
          <Button type='submit' onClick={() => setShowEllipseDialog(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
