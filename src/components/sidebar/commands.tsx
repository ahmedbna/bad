'use client';

import { Button } from '@/components/ui/button';
import {
  Move,
  Copy,
  RefreshCcw,
  Tally2,
  FlipHorizontal2,
  ArrowRightFromLine,
  ScissorsLineDashed,
  GitCommit,
  SquaresUnite,
  SquareRoundCorner,
  LucideSquareArrowOutUpRight,
  Eraser,
  Equal,
} from 'lucide-react';
import { Command } from '@/constants';

type Props = {
  selectedShapes: string[];
  handleDeleteShape: () => void;
  selectedCommand: Command | null;
  setSelectedCommand: (tool: Command) => void;
};

export const Commands = ({
  selectedShapes,
  selectedCommand,
  setSelectedCommand,
  handleDeleteShape,
}: Props) => {
  return (
    <div className='grid grid-cols-4 gap-2'>
      <Button
        size='sm'
        title='Copy'
        onClick={() => setSelectedCommand('copy')}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'copy' ? 'default' : 'outline'}
      >
        <Copy size={16} />
        <span className='text-[10px]'>Copy</span>
      </Button>

      <Button
        title='Move'
        onClick={() => setSelectedCommand('move')}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'move' ? 'default' : 'outline'}
      >
        <Move size={16} />
        <span className='text-[10px]'>Move</span>
      </Button>

      <Button
        size='sm'
        title='Rotate'
        onClick={() => {
          setSelectedCommand('rotate');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'rotate' ? 'default' : 'outline'}
      >
        <RefreshCcw size={16} />
        <span className='text-[10px]'>Rotate</span>
      </Button>

      <Button
        size='sm'
        title='Offset'
        onClick={() => {
          setSelectedCommand('offset');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'offset' ? 'default' : 'outline'}
      >
        <Equal className='w-4 h-4 rotate-90' />
        <span className='text-[10px]'>Offset</span>
      </Button>

      <Button
        size='sm'
        title='Mirror'
        onClick={() => {
          setSelectedCommand('mirror');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'mirror' ? 'default' : 'outline'}
      >
        <FlipHorizontal2 size={16} />
        <span className='text-[10px]'>Mirror</span>
      </Button>

      <Button
        size='sm'
        title='Stretch'
        onClick={() => {
          setSelectedCommand('stretch');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'stretch' ? 'default' : 'outline'}
      >
        <ArrowRightFromLine size={16} />
        <span className='text-[10px]'>Stretch</span>
      </Button>

      <Button
        size='sm'
        title='Trim'
        onClick={() => {
          setSelectedCommand('trim');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'trim' ? 'default' : 'outline'}
      >
        <ScissorsLineDashed size={16} />
        <span className='text-[10px]'>Trim</span>
      </Button>

      <Button
        size='sm'
        title='Extend'
        onClick={() => {
          setSelectedCommand('extend');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'extend' ? 'default' : 'outline'}
      >
        <GitCommit size={16} />
        <span className='text-[10px]'>Extend</span>
      </Button>

      <Button
        size='sm'
        title='Join'
        onClick={() => {
          setSelectedCommand('join');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'join' ? 'default' : 'outline'}
      >
        <SquaresUnite size={16} />
        <span className='text-[10px]'>Join</span>
      </Button>

      <Button
        size='sm'
        title='Chamfer'
        onClick={() => {
          setSelectedCommand('chamfer');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'chamfer' ? 'default' : 'outline'}
      >
        <LucideSquareArrowOutUpRight size={16} />
        <span className='text-[10px]'>Chamfer</span>
      </Button>

      <Button
        size='sm'
        title='Fillet'
        onClick={() => {
          setSelectedCommand('fillet');
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'fillet' ? 'default' : 'outline'}
      >
        <SquareRoundCorner size={16} />
        <span className='text-[10px]'>Fillet</span>
      </Button>

      <Button
        size='sm'
        title='Erase'
        onClick={() => {
          if (selectedShapes.length > 0) {
            handleDeleteShape();
          } else {
            setSelectedCommand('erase');
          }
        }}
        className='flex flex-col items-center justify-center h-12'
        variant={selectedCommand === 'erase' ? 'default' : 'outline'}
      >
        <Eraser size={16} />
        <span className='text-[10px]'>Erase</span>
      </Button>
    </div>
  );
};
