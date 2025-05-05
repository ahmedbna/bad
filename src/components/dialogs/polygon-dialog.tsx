'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

type Props = {
  polygonSides: number;
  showPolygonDialog: boolean;
  setPolygonSides: (sides: number) => void;
  setShowPolygonDialog: (show: boolean) => void;
};

export const PolygonDialog = ({
  polygonSides,
  showPolygonDialog,
  setPolygonSides,
  setShowPolygonDialog,
}: Props) => {
  return (
    <Dialog open={showPolygonDialog} onOpenChange={setShowPolygonDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Polygon Settings</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='sides' className='text-right'>
              Number of Sides
            </Label>
            <Input
              id='sides'
              type='number'
              min='3'
              max='32'
              value={polygonSides}
              onChange={(e) => setPolygonSides(parseInt(e.target.value, 10))}
              className='col-span-3'
            />
          </div>
        </div>
        <DialogFooter>
          <Button type='submit' onClick={() => setShowPolygonDialog(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
