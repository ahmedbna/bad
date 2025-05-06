'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

export const DimensionDialog = ({
  showDimensionDialog,
  setShowDimensionDialog,
  dimensionParams,
  setDimensionParams,
}: {
  showDimensionDialog: boolean;
  setShowDimensionDialog: (show: boolean) => void;
  dimensionParams: {
    dimensionType: 'linear' | 'angular' | 'radius' | 'diameter';
    offset: number;
    extensionLineOffset: number;
    arrowSize: number;
    textHeight: number;
    precision: number;
    units: string;
    showValue: boolean;
    textRotation: number;
  };
  setDimensionParams: (params: any) => void;
}) => {
  return (
    <Dialog open={showDimensionDialog} onOpenChange={setShowDimensionDialog}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Dimension Properties</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='dimensionType' className='text-right'>
              Type
            </Label>
            <Select
              value={dimensionParams.dimensionType}
              onValueChange={(
                value: 'linear' | 'angular' | 'radius' | 'diameter'
              ) =>
                setDimensionParams({ ...dimensionParams, dimensionType: value })
              }
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='linear'>Linear</SelectItem>
                <SelectItem value='angular'>Angular</SelectItem>
                <SelectItem value='radius'>Radius</SelectItem>
                <SelectItem value='diameter'>Diameter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='offset' className='text-right'>
              Offset ({dimensionParams.offset})
            </Label>
            <Slider
              id='offset'
              className='col-span-3'
              min={5}
              max={100}
              step={1}
              value={[dimensionParams.offset]}
              onValueChange={(value) =>
                setDimensionParams({ ...dimensionParams, offset: value[0] })
              }
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='extensionLineOffset' className='text-right'>
              Ext. Line
            </Label>
            <Slider
              id='extensionLineOffset'
              className='col-span-3'
              min={0}
              max={20}
              step={1}
              value={[dimensionParams.extensionLineOffset]}
              onValueChange={(value) =>
                setDimensionParams({
                  ...dimensionParams,
                  extensionLineOffset: value[0],
                })
              }
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='arrowSize' className='text-right'>
              Arrow Size
            </Label>
            <Slider
              id='arrowSize'
              className='col-span-3'
              min={2}
              max={20}
              step={1}
              value={[dimensionParams.arrowSize]}
              onValueChange={(value) =>
                setDimensionParams({ ...dimensionParams, arrowSize: value[0] })
              }
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='textHeight' className='text-right'>
              Text Height
            </Label>
            <Slider
              id='textHeight'
              className='col-span-3'
              min={8}
              max={24}
              step={1}
              value={[dimensionParams.textHeight]}
              onValueChange={(value) =>
                setDimensionParams({ ...dimensionParams, textHeight: value[0] })
              }
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='precision' className='text-right'>
              Precision
            </Label>
            <Select
              value={dimensionParams.precision.toString()}
              onValueChange={(value) =>
                setDimensionParams({
                  ...dimensionParams,
                  precision: parseInt(value),
                })
              }
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Precision' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='0'>0</SelectItem>
                <SelectItem value='1'>0.0</SelectItem>
                <SelectItem value='2'>0.00</SelectItem>
                <SelectItem value='3'>0.000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='units' className='text-right'>
              Units
            </Label>
            <Input
              id='units'
              className='col-span-3'
              value={dimensionParams.units}
              onChange={(e) =>
                setDimensionParams({
                  ...dimensionParams,
                  units: e.target.value,
                })
              }
              placeholder='mm, cm, etc.'
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='showValue' className='text-right'>
              Show Value
            </Label>
            <div className='col-span-3'>
              <Switch
                id='showValue'
                checked={dimensionParams.showValue}
                onCheckedChange={(checked) =>
                  setDimensionParams({ ...dimensionParams, showValue: checked })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type='submit' onClick={() => setShowDimensionDialog(false)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
