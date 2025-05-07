'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  Spline,
  Hexagon,
  PenTool,
  Egg,
  Grid,
  Crosshair,
  Target,
  Workflow,
  Asterisk,
  ArrowDownRight,
  ArrowDownLeft,
  RouteOff,
  BoomBox,
  ArrowUpRight,
  Ruler,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Command, DrawingTool } from '@/constants';
import { SnapMode } from '../snap/useSnapping';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Point } from '@/types';
import { StatusBar } from './status-bar';
import { Commands } from './commands';

type Props = {
  selectedTool: DrawingTool;
  selectedShapes: string[];
  gridSize: number;
  setSelectedShapes: React.Dispatch<React.SetStateAction<string[]>>;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  snapSettings: {
    enabled: boolean;
    modes: Set<SnapMode>;
    threshold: number;
    gridSize: number;
  };
  mousePosition: Point | null;
  scale: number;
  offset: Point;
  toggleSnapping: () => void;
  handleDeleteShape: () => void;
  setGridSize: (size: number) => void;
  setShowArcMode: (show: boolean) => void;
  toggleSnapMode: (mode: SnapMode) => void;
  setSelectedTool: (tool: DrawingTool) => void;
  setSnapSettings: React.Dispatch<
    React.SetStateAction<{
      enabled: boolean;
      modes: Set<SnapMode>;
      threshold: number;
      gridSize: number;
    }>
  >;
  setShowTextDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPolygonDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowEllipseDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSplineDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDimensionDialog: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCommand: Command | null;
  setSelectedCommand: (tool: Command) => void;
};

export const Tools = ({
  gridSize,
  selectedTool,
  setSelectedTool,
  setSelectedShapes,
  selectedShapes,
  setGridSize,
  setScale,
  handleDeleteShape,
  setShowArcMode,
  snapSettings,
  toggleSnapMode,
  toggleSnapping,
  mousePosition,
  scale,
  offset,
  setSnapSettings,
  setShowTextDialog,
  setShowPolygonDialog,
  setShowEllipseDialog,
  setShowSplineDialog,
  setShowDimensionDialog,
  selectedCommand,
  setSelectedCommand,
}: Props) => {
  const isSnapModeActive = (mode: SnapMode): boolean => {
    return snapSettings.modes.has(mode);
  };

  return (
    <div className='h-full flex flex-col'>
      <div className='h-full flex-grow overflow-y-auto'>
        <h2 className='text-md font-bold text-muted-foreground mb-1'>Draw</h2>
        <div className='grid grid-cols-4 gap-2'>
          <Button
            title='Select'
            onClick={() => setSelectedTool('select')}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'select' ? 'default' : 'outline'}
          >
            <LucideBoxSelect size={16} />
            <span className='text-[10px]'>Select</span>
          </Button>

          <Button
            size='sm'
            title='Pan'
            onClick={() => setSelectedTool('pan')}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'pan' ? 'default' : 'outline'}
          >
            <Hand size={16} />
            <span className='text-[10px]'>Pan</span>
          </Button>

          {/* <Button
        size='sm'
        variant='outline'
        className='flex flex-col items-center justify-center h-12'
        onClick={() => setScale((prev) => prev * 1.2)}
      >
        <ZoomIn size={16} />
      </Button>

      <Button
        size='sm'
        variant='outline'
        className='flex flex-col items-center justify-center h-12'
        onClick={() => setScale((prev) => prev * 0.8)}
      >
        <ZoomOut size={16} />
      </Button> */}

          <Button
            size='sm'
            title='Line'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('line');
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'line' ? 'default' : 'outline'}
          >
            <Minus size={16} />
            <span className='text-[10px]'>Line</span>
          </Button>

          <Button
            size='sm'
            title='Rectangle'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('rectangle');
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
          >
            <Square size={16} />
            <span className='text-[10px]'>Rectangle</span>
          </Button>

          <Button
            size='sm'
            title='Circle'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('circle');
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'circle' ? 'default' : 'outline'}
          >
            <Circle size={16} />
            <span className='text-[10px]'>Circle</span>
          </Button>

          <Button
            size='sm'
            title='Arc'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('arc');
              setShowArcMode(true);
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'arc' ? 'default' : 'outline'}
          >
            <Spline size={16} />
            <span className='text-[10px]'>Arc</span>
          </Button>

          <Button
            size='sm'
            title='Ellipse'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('ellipse');
              setShowEllipseDialog(true);
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'ellipse' ? 'default' : 'outline'}
          >
            <Egg size={16} />
            <span className='text-[10px]'>Ellipse</span>
          </Button>

          <Button
            size='sm'
            title='Polygon'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('polygon');
              setShowPolygonDialog(true);
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'polygon' ? 'default' : 'outline'}
          >
            <Hexagon size={16} />
            <span className='text-[10px]'>Polygon</span>
          </Button>

          <Button
            size='sm'
            title='Polyline'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('polyline');
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'polyline' ? 'default' : 'outline'}
          >
            <Slash size={16} />
            <span className='text-[10px]'>Polyline</span>
          </Button>

          <Button
            size='sm'
            title='Spline'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('spline');
              setShowSplineDialog(true);
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'spline' ? 'default' : 'outline'}
          >
            <PenTool size={16} />
            <span className='text-[10px]'>Spline</span>
          </Button>

          <Button
            size='sm'
            title='Text'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('text');
              setShowTextDialog(true);
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'text' ? 'default' : 'outline'}
          >
            <Type size={16} />
            <span className='text-[10px]'>Text</span>
          </Button>

          <Button
            size='sm'
            title='Dimension'
            onClick={() => {
              setSelectedShapes([]);
              setSelectedTool('dimension');
              setShowDimensionDialog(true);
            }}
            className='flex flex-col items-center justify-center h-12'
            variant={selectedTool === 'dimension' ? 'default' : 'outline'}
          >
            <Ruler size={16} />
            <span className='text-[10px]'>Dimension</span>
          </Button>
        </div>
      </div>

      <Separator className='my-4' />

      <h2 className='text-md font-bold text-muted-foreground mb-1'>Modify</h2>
      <Commands
        selectedShapes={selectedShapes}
        selectedCommand={selectedCommand}
        setSelectedCommand={setSelectedCommand}
        handleDeleteShape={handleDeleteShape}
      />

      <Separator className='my-4' />

      <div>
        <div className='flex items-center gap-1'>
          <Select
            value={gridSize.toString()}
            onValueChange={(val) => {
              setGridSize(parseInt(val));
              setSnapSettings({
                ...snapSettings,
                gridSize: parseInt(val),
              });
            }}
          >
            <SelectTrigger size='sm'>
              <SelectValue placeholder='Grid Size' />
            </SelectTrigger>
            <SelectGroup>
              <SelectContent>
                <SelectLabel>Grid Size</SelectLabel>
                <SelectItem value='5'>5 units</SelectItem>
                <SelectItem value='10'>10 units</SelectItem>
                <SelectItem value='20'>20 units</SelectItem>
                <SelectItem value='50'>50 units</SelectItem>
                <SelectItem value='100'>100 units</SelectItem>
              </SelectContent>
            </SelectGroup>
          </Select>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    Snap Modes <Crosshair size={16} className='ml-1' />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure active snap modes</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent className='w-52'>
              <Button
                className='w-full'
                onClick={toggleSnapping}
                variant={snapSettings.enabled ? 'default' : 'outline'}
              >
                {/* <Magnet size={16} className='mr-1' /> */}
                {snapSettings.enabled ? 'Snap: On' : 'Snap: Off'}
              </Button>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.ENDPOINT)}
                onCheckedChange={() => toggleSnapMode(SnapMode.ENDPOINT)}
              >
                <Target size={16} className='mr-2' /> Endpoint
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.MIDPOINT)}
                onCheckedChange={() => toggleSnapMode(SnapMode.MIDPOINT)}
              >
                <ArrowDownRight size={16} className='mr-2' /> Midpoint
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.CENTER)}
                onCheckedChange={() => toggleSnapMode(SnapMode.CENTER)}
              >
                <Asterisk size={16} className='mr-2' /> Center
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.NODE)}
                onCheckedChange={() => toggleSnapMode(SnapMode.NODE)}
              >
                <BoomBox size={16} className='mr-2' /> Node
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.QUADRANT)}
                onCheckedChange={() => toggleSnapMode(SnapMode.QUADRANT)}
              >
                <Workflow size={16} className='mr-2' /> Quadrant
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.INTERSECTION)}
                onCheckedChange={() => toggleSnapMode(SnapMode.INTERSECTION)}
              >
                <ArrowUpRight size={16} className='mr-2' /> Intersection
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.PERPENDICULAR)}
                onCheckedChange={() => toggleSnapMode(SnapMode.PERPENDICULAR)}
              >
                <ArrowDownLeft size={16} className='mr-2' /> Perpendicular
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.TANGENT)}
                onCheckedChange={() => toggleSnapMode(SnapMode.TANGENT)}
              >
                <RouteOff size={16} className='mr-2' /> Tangent
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.GRID)}
                onCheckedChange={() => toggleSnapMode(SnapMode.GRID)}
              >
                <Grid size={16} className='mr-2' /> Grid
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <StatusBar
          scale={scale}
          offset={offset}
          selectedTool={selectedTool}
          mousePosition={mousePosition}
        />
      </div>
    </div>
  );
};
