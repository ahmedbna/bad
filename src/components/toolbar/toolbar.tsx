'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Circle,
  Square,
  Minus,
  Slash,
  Hand,
  LucideBoxSelect,
} from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { DrawingTool } from '@/types/drawing-tool';

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  selectedTool: DrawingTool;
  selectedShapes: string[];
  snapToGrid: boolean;
  gridSize: number;
  setSelectedTool: (tool: DrawingTool) => void;
  setSelectedShapes: React.Dispatch<React.SetStateAction<string[]>>;
  setGridSize: (size: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setOffset: (offset: { x: number; y: number }) => void;
  handleDeleteShape: () => void;
};

export const Toolbar = ({
  canvasRef,
  gridSize,
  selectedTool,
  setSelectedTool,
  setSelectedShapes,
  selectedShapes,
  setSnapToGrid,
  snapToGrid,
  setGridSize,
  setScale,
  setOffset,
  handleDeleteShape,
}: Props) => {
  return (
    <div className='p-2 border-b flex items-center space-x-4'>
      <div className='flex space-x-2'>
        <ModeToggle />

        <Button
          variant={selectedTool === 'select' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setSelectedTool('select')}
          title='Select'
        >
          <LucideBoxSelect size={16} />
        </Button>
        <Button
          variant={selectedTool === 'pan' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setSelectedTool('pan')}
          title='Pan'
        >
          <Hand size={16} />
        </Button>
        <Button
          variant={selectedTool === 'line' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setSelectedTool('line');
            setSelectedShapes([]);
          }}
          title='Line'
        >
          <Minus size={16} />
        </Button>
        <Button
          variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setSelectedTool('rectangle');
            setSelectedShapes([]);
          }}
          title='Rectangle'
        >
          <Square size={16} />
        </Button>
        <Button
          variant={selectedTool === 'circle' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setSelectedTool('circle');
            setSelectedShapes([]);
          }}
          title='Circle'
        >
          <Circle size={16} />
        </Button>
        <Button
          variant={selectedTool === 'polyline' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setSelectedTool('polyline');
            setSelectedShapes([]);
          }}
          title='Polyline'
        >
          <Slash size={16} />
        </Button>
      </div>

      <Separator orientation='vertical' className='h-8' />

      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setSnapToGrid(!snapToGrid)}
          title={snapToGrid ? 'Snap On' : 'Snap Off'}
        >
          {snapToGrid ? 'Snap: On' : 'Snap: Off'}
        </Button>

        <Select
          value={gridSize.toString()}
          onValueChange={(val) => setGridSize(parseInt(val))}
        >
          <SelectTrigger className='w-24'>
            <SelectValue placeholder='Grid Size' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='5'>5 units</SelectItem>
            <SelectItem value='10'>10 units</SelectItem>
            <SelectItem value='20'>20 units</SelectItem>
            <SelectItem value='50'>50 units</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation='vertical' className='h-8' />

      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setScale(1);
            setOffset({
              x: canvasRef.current?.width ?? 0 / 2,
              y: canvasRef.current?.height ?? 0 / 2,
            });
          }}
        >
          Reset View
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={() => setScale((prev) => prev * 1.2)}
        >
          Zoom In
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={() => setScale((prev) => prev * 0.8)}
        >
          Zoom Out
        </Button>
      </div>

      {selectedShapes.length > 0 ? (
        <>
          <Separator orientation='vertical' className='h-8' />
          <Button variant='destructive' size='sm' onClick={handleDeleteShape}>
            Delete Selected
          </Button>
        </>
      ) : null}
    </div>
  );
};
