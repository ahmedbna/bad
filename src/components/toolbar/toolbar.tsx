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
  Magnet,
  Sliders,
  Ruler,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { DrawingTool } from '@/constants';
import { SnapMode, SnapSettings } from '../snap/useSnapping';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  toggleSnapping: () => void;
  handleDeleteShape: () => void;
  setGridSize: (size: number) => void;
  setShowArcMode: (show: boolean) => void;
  toggleSnapMode: (mode: SnapMode) => void;
  setSnapSettings: React.Dispatch<
    React.SetStateAction<{
      enabled: boolean;
      modes: Set<SnapMode>;
      threshold: number;
      gridSize: number;
    }>
  >;
  setSelectedTool: (tool: DrawingTool) => void;
  updateSnapThreshold: (value: number) => void;
};

export const Toolbar = ({
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
  setSnapSettings,
  updateSnapThreshold,
}: Props) => {
  const isSnapModeActive = (mode: SnapMode): boolean => {
    return snapSettings.modes.has(mode);
  };

  return (
    <div className='p-2 border-b flex items-center space-x-4 overflow-x-auto'>
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
      </div>

      <Separator orientation='vertical' className='h-8' />

      <div className='flex space-x-2'>
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
          variant={selectedTool === 'arc' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setShowArcMode(true);
            setSelectedTool('arc');
            setSelectedShapes([]);
          }}
          title='Arc'
        >
          <Spline size={16} />
        </Button>

        <Button
          variant={selectedTool === 'ellipse' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setSelectedTool('ellipse');
            setSelectedShapes([]);
          }}
          title='Ellipse'
        >
          <Egg size={16} />
        </Button>

        <Button
          variant={selectedTool === 'polygon' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setSelectedTool('polygon');
            setSelectedShapes([]);
          }}
          title='Polygon'
        >
          <Hexagon size={16} />
        </Button>

        <Button
          variant={selectedTool === 'spline' ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setSelectedTool('spline');
            setSelectedShapes([]);
          }}
          title='Spline'
        >
          <PenTool size={16} />
        </Button>

        <Button
          variant={selectedTool === 'text' ? 'default' : 'outline'}
          size='icon'
          className='h-8 w-8'
          onClick={() => {
            setSelectedTool('text');
          }}
          title='Text'
        >
          <Type size={16} />
        </Button>

        <Button
          variant={selectedTool === 'dimension' ? 'default' : 'outline'}
          size='icon'
          className='h-8 w-8'
          onClick={() => {
            setSelectedTool('dimension');
          }}
          title='Dimension'
        >
          <Ruler size={16} />
        </Button>
      </div>

      <Separator orientation='vertical' className='h-8' />

      {/* Snapping Controls */}
      <div className='flex items-center space-x-2'>
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={snapSettings.enabled ? 'default' : 'outline'}
              size='sm'
              onClick={toggleSnapping}
            >
              <Magnet size={16} className='mr-1' />
              {snapSettings.enabled ? 'Snap: On' : 'Snap: Off'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enable/disable all snapping</p>
          </TooltipContent>
        </Tooltip> */}

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

            {/* <DropdownMenuCheckboxItem
              // checked={isSnapModeActive(SnapMode.ENDPOINT)}
              onCheckedChange={toggleSnapping}
              className={`bg-primary`}
            >
              <Magnet size={16} className='mr-1' />
              {snapSettings.enabled ? 'Snap: On' : 'Snap: Off'}
            </DropdownMenuCheckboxItem> */}

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

        {/* <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center space-x-2'>
              <Sliders size={16} />
              <div className='w-24'>
                <Slider
                  value={[snapSettings.threshold]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => updateSnapThreshold(value[0])}
                />
              </div>
              <span className='text-xs'>{snapSettings.threshold}px</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Snap threshold distance</p>
          </TooltipContent>
        </Tooltip> */}
      </div>

      <Separator orientation='vertical' className='h-8' />

      <div className='flex items-center space-x-2'>
        <Select
          value={gridSize.toString()}
          onValueChange={(val) => {
            setGridSize(parseInt(val));
            setSnapSettings((prev) => ({
              ...prev,
              gridSize: parseInt(val),
            }));
          }}
        >
          <SelectTrigger className='w-24'>
            <SelectValue placeholder='Grid Size' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='5'>5 units</SelectItem>
            <SelectItem value='10'>10 units</SelectItem>
            <SelectItem value='20'>20 units</SelectItem>
            <SelectItem value='50'>50 units</SelectItem>
            <SelectItem value='100'>100 units</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-center space-x-2'>
        {/* <Button
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
        </Button> */}

        <Button
          variant='outline'
          size='sm'
          onClick={() => setScale((prev) => prev * 1.2)}
        >
          <ZoomIn size={16} />
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={() => setScale((prev) => prev * 0.8)}
        >
          <ZoomOut size={16} />
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
