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
import { Shape } from '@/types';

type Props = {
  shapes: Shape[];
  showTextDialog: boolean;
  setShowTextDialog: (show: boolean) => void;
  textParams: {
    content: string;
    fontSize: number;
    fontFamily: string;
    fontStyle: string;
    fontWeight: string;
    rotation: number;
    justification: 'left' | 'center' | 'right';
  };
  setTextParams: (params: any) => void;
  editingTextId: string | null;
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  setEditingTextId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const TextDialog = ({
  shapes,
  showTextDialog,
  setShowTextDialog,
  textParams,
  setTextParams,
  editingTextId,
  setShapes,
  setEditingTextId,
}: Props) => {
  const handleApply = () => {
    if (editingTextId) {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === editingTextId
            ? {
                ...shape,
                properties: {
                  ...shape.properties,
                  textParams: {
                    ...textParams,
                  },
                },
              }
            : shape
        )
      );
    }
    setShowTextDialog(false);
    setEditingTextId(null);
  };

  return (
    <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            <div className='border rounded-md p-4 mb-4 flex justify-center items-center min-h-24 bg-muted/20'>
              <div
                style={{
                  fontFamily: textParams.fontFamily,
                  fontSize: `${textParams.fontSize}px`,
                  fontStyle: textParams.fontStyle,
                  fontWeight: textParams.fontWeight,
                  transform: `rotate(${textParams.rotation}deg)`,
                  textAlign: textParams.justification,
                  width: '100%',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                {textParams.content || 'Text Preview'}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='content' className='text-right'>
              Text
            </Label>
            <Input
              id='content'
              className='col-span-3'
              value={textParams.content}
              onChange={(e) =>
                setTextParams({ ...textParams, content: e.target.value })
              }
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='fontFamily' className='text-right'>
              Font
            </Label>
            <Select
              value={textParams.fontFamily}
              onValueChange={(value) =>
                setTextParams({ ...textParams, fontFamily: value })
              }
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Font' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Arial'>Arial</SelectItem>
                <SelectItem value='Times New Roman'>Times New Roman</SelectItem>
                <SelectItem value='Courier New'>Courier New</SelectItem>
                <SelectItem value='Verdana'>Verdana</SelectItem>
                <SelectItem value='Georgia'>Georgia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='fontSize' className='text-right'>
              Size ({textParams.fontSize}px)
            </Label>
            <Slider
              id='fontSize'
              className='col-span-3'
              min={8}
              max={72}
              step={1}
              value={[textParams.fontSize]}
              onValueChange={(value) =>
                setTextParams({ ...textParams, fontSize: value[0] })
              }
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='fontStyle' className='text-right'>
              Style
            </Label>
            <Select
              value={textParams.fontStyle}
              onValueChange={(value) =>
                setTextParams({ ...textParams, fontStyle: value })
              }
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Style' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='normal'>Normal</SelectItem>
                <SelectItem value='italic'>Italic</SelectItem>
                <SelectItem value='oblique'>Oblique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='fontWeight' className='text-right'>
              Weight
            </Label>
            <Select
              value={textParams.fontWeight}
              onValueChange={(value) =>
                setTextParams({ ...textParams, fontWeight: value })
              }
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Weight' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='normal'>Normal</SelectItem>
                <SelectItem value='bold'>Bold</SelectItem>
                <SelectItem value='lighter'>Lighter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='justification' className='text-right'>
              Align
            </Label>
            <Select
              value={textParams.justification}
              onValueChange={(value: 'left' | 'center' | 'right') =>
                setTextParams({ ...textParams, justification: value })
              }
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Alignment' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='left'>Left</SelectItem>
                <SelectItem value='center'>Center</SelectItem>
                <SelectItem value='right'>Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='rotation' className='text-right'>
              Rotation ({textParams.rotation}°)
            </Label>
            <Slider
              id='rotation'
              className='col-span-3'
              min={0}
              max={359}
              step={1}
              value={[textParams.rotation]}
              onValueChange={(value) =>
                setTextParams({ ...textParams, rotation: value[0] })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button type='submit' onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
