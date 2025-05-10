import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface PolarTrackingDialogProps {
  showPolarDialog: boolean;
  setShowPolarDialog: React.Dispatch<React.SetStateAction<boolean>>;
  polarSettings: {
    enabled: boolean;
    angleIncrement: number;
    angles: number[];
    snapThreshold: number;
    trackingLines: boolean;
  };
  setPolarSettings: React.Dispatch<
    React.SetStateAction<{
      enabled: boolean;
      angleIncrement: number;
      angles: number[];
      snapThreshold: number;
      trackingLines: boolean;
    }>
  >;
  updatePolarAngleIncrement: (increment: number) => void;
  togglePolarTracking: () => void;
}

export const PolarTrackingDialog: React.FC<PolarTrackingDialogProps> = ({
  showPolarDialog,
  setShowPolarDialog,
  polarSettings,
  setPolarSettings,
  updatePolarAngleIncrement,
  togglePolarTracking,
}) => {
  const [tempSettings, setTempSettings] = React.useState({
    angleIncrement: polarSettings.angleIncrement,
    snapThreshold: polarSettings.snapThreshold,
    trackingLines: polarSettings.trackingLines,
  });

  // Reset temp settings when dialog opens
  React.useEffect(() => {
    if (showPolarDialog) {
      setTempSettings({
        angleIncrement: polarSettings.angleIncrement,
        snapThreshold: polarSettings.snapThreshold,
        trackingLines: polarSettings.trackingLines,
      });
    }
  }, [showPolarDialog, polarSettings]);

  const handleSave = () => {
    updatePolarAngleIncrement(tempSettings.angleIncrement);
    setPolarSettings((prev) => ({
      ...prev,
      snapThreshold: tempSettings.snapThreshold,
      trackingLines: tempSettings.trackingLines,
    }));
    setShowPolarDialog(false);
  };

  return (
    <Dialog open={showPolarDialog} onOpenChange={setShowPolarDialog}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Polar Tracking Settings</DialogTitle>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-2 items-center gap-4'>
            <Label htmlFor='trackingLines' className='text-right'>
              Enable Polar Tracking
            </Label>
            <div>
              <Switch
                id='polarTracking'
                checked={polarSettings.enabled}
                onCheckedChange={togglePolarTracking}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 items-center gap-4'>
            <Label htmlFor='angleIncrement' className='text-right'>
              {`Angle Increment (dgree°)`}
            </Label>
            <Input
              id='angleIncrement'
              type='number'
              min='1'
              max='90'
              value={tempSettings.angleIncrement}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  angleIncrement: Math.max(
                    1,
                    Math.min(90, parseInt(e.target.value) || 45)
                  ),
                })
              }
            />
          </div>
          <div className='grid grid-cols-2 items-center gap-4'>
            <Label htmlFor='snapThreshold' className='text-right'>
              Snap Threshold (px)
            </Label>
            <Input
              id='snapThreshold'
              type='number'
              min='1'
              max='50'
              value={tempSettings.snapThreshold}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  snapThreshold: Math.max(
                    1,
                    Math.min(50, parseInt(e.target.value) || 10)
                  ),
                })
              }
            />
          </div>
          <div className='grid grid-cols-2 items-center gap-4'>
            <Label htmlFor='trackingLines' className='text-right'>
              Show Tracking Lines
            </Label>
            <div>
              <Switch
                id='trackingLines'
                checked={tempSettings.trackingLines}
                onCheckedChange={(checked) =>
                  setTempSettings({
                    ...tempSettings,
                    trackingLines: checked,
                  })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => setShowPolarDialog(false)}
          >
            Cancel
          </Button>
          <Button type='submit' onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
