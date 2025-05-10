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
  Radar,
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
import { Point, PolarSettings } from '@/types';
import { StatusBar } from './status-bar';
import { Commands } from './commands';
import { ShapeInputPanel } from './shape-input-panel';
import { Switch } from '../ui/switch';
import { EditingState } from '../editing/constants';
import { EditingToolbar } from '../editing/editing-toolbar';

type Props = {
  selectedTool: DrawingTool;
  selectedShapes: string[];
  gridSize: number;
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
  handleCancelDrawing: () => void;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
  polarSettings: PolarSettings;
  setShowPolarDialog: React.Dispatch<React.SetStateAction<boolean>>;
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  statusMessage: string;
  commandBuffer: string;
};

export const Tools = ({
  gridSize,
  selectedTool,
  setSelectedTool,
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
  handleCancelDrawing,
  setSelectedTab,
  polarSettings,
  setShowPolarDialog,
  editingState,
  setEditingState,
  statusMessage,
  commandBuffer,
}: Props) => {
  const isSnapModeActive = (mode: SnapMode): boolean => {
    return snapSettings.modes.has(mode);
  };

  return (
    <div className='h-full overflow-y-auto'>
      <h2 className='text-md font-bold text-muted-foreground mb-1'>Draw</h2>
      <div className='grid grid-cols-4 gap-2'>
        <Button
          title='Select'
          onClick={() => {
            handleCancelDrawing();
            setSelectedTool('select');
          }}
          className='flex flex-col items-center justify-center h-12'
          variant={selectedTool === 'select' ? 'default' : 'outline'}
        >
          <LucideBoxSelect size={16} />
          <span className='text-[10px]'>Select</span>
        </Button>

        <Button
          size='sm'
          title='Pan'
          onClick={() => {
            handleCancelDrawing();
            setSelectedTool('pan');
          }}
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
            handleCancelDrawing();
            setSelectedTool('line');
            setSelectedTab('props');
          }}
          className='flex flex-col items-center justify-center h-12'
          variant={selectedTool === 'line' ? 'default' : 'outline'}
        >
          <Slash size={16} className='rotate-45' />
          <span className='text-[10px]'>Line</span>
        </Button>

        <Button
          size='sm'
          title='Rectangle'
          onClick={() => {
            handleCancelDrawing();
            setSelectedTool('rectangle');
            setSelectedTab('props');
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
            handleCancelDrawing();
            setSelectedTool('circle');
            setSelectedTab('props');
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
            handleCancelDrawing();
            setSelectedTool('arc');
            setShowArcMode(true);
            setSelectedTab('props');
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
            handleCancelDrawing();
            setSelectedTool('ellipse');
            setShowEllipseDialog(true);
            setSelectedTab('props');
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
            handleCancelDrawing();
            setSelectedTool('polygon');
            setShowPolygonDialog(true);
            setSelectedTab('props');
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
            handleCancelDrawing();
            setSelectedTool('polyline');
            setSelectedTab('props');
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
            handleCancelDrawing();
            setSelectedTool('spline');
            setShowSplineDialog(true);
            setSelectedTab('props');
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
            handleCancelDrawing();
            setSelectedTool('text');
            setShowTextDialog(true);
            setSelectedTab('props');
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
            handleCancelDrawing();
            setSelectedTool('dimension');
            setShowDimensionDialog(true);
            setSelectedTab('props');
          }}
          className='flex flex-col items-center justify-center h-12'
          variant={selectedTool === 'dimension' ? 'default' : 'outline'}
        >
          <Ruler size={16} />
          <span className='text-[10px]'>Dimension</span>
        </Button>
      </div>

      <Separator className='my-4' />

      {/* Add the editing toolbar component above the canvas */}
      <EditingToolbar
        editingState={editingState}
        setEditingState={setEditingState}
      />

      {/* Show status message when in editing mode */}
      {editingState.isActive && (
        <div className='absolute top-4 left-1/2 transform -translate-x-1/2 bg-background px-4 py-2 rounded-md shadow-md z-10 border'>
          <p className='text-sm font-medium'>{statusMessage}</p>
          {commandBuffer && (
            <p className='text-xs text-muted-foreground'>{commandBuffer}</p>
          )}
        </div>
      )}

      {/* Add a command line input for numeric values during editing */}
      {editingState.isActive && editingState.phase === 'parameter' && (
        <div className='border-t p-2 flex items-center'>
          <span className='text-sm font-medium mr-2'>Command:</span>
          <input
            type='text'
            className='px-2 py-1 border rounded flex-1'
            placeholder='Enter value...'
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = parseFloat(e.currentTarget.value);
                if (!isNaN(value)) {
                  // Update parameter and move to next phase
                  if (editingState.tool === 'rotate') {
                    setEditingState({
                      ...editingState,
                      parameters: { ...editingState.parameters, angle: value },
                      phase: 'target',
                    });
                  } else if (editingState.tool === 'offset') {
                    setEditingState({
                      ...editingState,
                      parameters: {
                        ...editingState.parameters,
                        distance: value,
                      },
                      phase: 'select',
                    });
                  } else if (editingState.tool === 'chamfer') {
                    if (!editingState.parameters.distance1) {
                      setEditingState({
                        ...editingState,
                        parameters: {
                          ...editingState.parameters,
                          distance1: value,
                        },
                      });
                    } else {
                      setEditingState({
                        ...editingState,
                        parameters: {
                          ...editingState.parameters,
                          distance2: value,
                        },
                        phase: 'select',
                      });
                    }
                  } else if (editingState.tool === 'fillet') {
                    setEditingState({
                      ...editingState,
                      parameters: { ...editingState.parameters, radius: value },
                      phase: 'select',
                    });
                  }
                  e.currentTarget.value = '';
                }
              }
            }}
          />
        </div>
      )}

      {/* <h2 className='text-md font-bold text-muted-foreground mb-1'>Modify</h2>
      <Commands
        selectedShapes={selectedShapes}
        selectedCommand={selectedCommand}
        setSelectedCommand={setSelectedCommand}
        handleDeleteShape={handleDeleteShape}
      /> */}

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

              {/* <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.PERPENDICULAR)}
                onCheckedChange={() => toggleSnapMode(SnapMode.PERPENDICULAR)}
              >
                <ArrowDownLeft size={16} className='mr-2' /> Perpendicular
              </DropdownMenuCheckboxItem> */}

              <DropdownMenuCheckboxItem
                checked={isSnapModeActive(SnapMode.NEAREST)}
                onCheckedChange={() => toggleSnapMode(SnapMode.NEAREST)}
              >
                <ArrowDownLeft size={16} className='mr-2' /> Nearset
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

        {/* Polar Tracking controls */}
        <Button
          size='sm'
          variant='outline'
          className='w-full flex items-center mt-2 mb-4'
          onClick={() => setShowPolarDialog(true)}
        >
          <Radar size={16} />
          <span className='ml-1'>
            {polarSettings.enabled
              ? `Polar Tracking: ${polarSettings.angleIncrement}°`
              : 'Polar Tracking: Off'}
          </span>
        </Button>

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
