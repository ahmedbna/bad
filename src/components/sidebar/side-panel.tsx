'use client';

import { DrawingTool } from '@/constants';
import { Point, PolarSettings } from '@/types';
import { SnapMode } from '../snap/useSnapping';
import { Tools } from './tools';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShapeInputPanel } from './shape-input-panel';
import { EditingState } from '../editing/constants';
import { Doc, Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';

type Props = {
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  mousePosition: Point | null;
  scale: number;
  offset: Point;
  gridSize: number;
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
  setSelectedTool: (tool: DrawingTool) => void;
  handleCancelDrawing: () => void;
  completeShape: (points: Point[], properties?: any) => void;
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
  selectedTab: string;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setTempShape: React.Dispatch<React.SetStateAction<Doc<'shapes'> | null>>;
  polarSettings: PolarSettings;
  setShowPolarDialog: React.Dispatch<React.SetStateAction<boolean>>;
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  setShowCollabsDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

export const SidePanel = ({
  selectedTool,
  drawingPoints,
  mousePosition,
  scale,
  offset,
  handleCancelDrawing,
  completeShape,
  gridSize,
  setSelectedTool,
  setGridSize,
  setScale,
  handleDeleteShape,
  setShowArcMode,
  snapSettings,
  toggleSnapMode,
  toggleSnapping,
  setSnapSettings,
  setShowTextDialog,
  setShowPolygonDialog,
  setShowEllipseDialog,
  setShowSplineDialog,
  setShowDimensionDialog,
  selectedTab,
  setSelectedTab,
  setDrawingPoints,
  setTempShape,
  polarSettings,
  setShowPolarDialog,
  editingState,
  setEditingState,
  setShowCollabsDialog,
}: Props) => {
  return (
    <div className='w-64 h-full flex flex-col border-r'>
      <div className='w-full border-b'>
        <div className='px-2 py-1 flex items-center justify-between'>
          <Link href='/'>
            <h1 className='font-black text-2xl'>BNA</h1>
          </Link>

          <ModeToggle variant='ghost' />
        </div>
      </div>

      <div className='p-2'>
        <Tabs
          defaultValue={selectedTab}
          value={selectedTab}
          onValueChange={setSelectedTab}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='tools'>Tools</TabsTrigger>
            <TabsTrigger value='props'>Props</TabsTrigger>
            <TabsTrigger value='ai'>AI</TabsTrigger>
          </TabsList>
          <TabsContent value='tools'>
            <Tools
              gridSize={gridSize}
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
              setGridSize={setGridSize}
              setScale={setScale}
              scale={scale}
              offset={offset}
              mousePosition={mousePosition}
              handleDeleteShape={handleDeleteShape}
              setShowArcMode={setShowArcMode}
              snapSettings={snapSettings}
              toggleSnapMode={toggleSnapMode}
              toggleSnapping={toggleSnapping}
              setSnapSettings={setSnapSettings}
              setShowTextDialog={setShowTextDialog}
              setShowPolygonDialog={setShowPolygonDialog}
              setShowEllipseDialog={setShowEllipseDialog}
              setShowSplineDialog={setShowSplineDialog}
              setShowDimensionDialog={setShowDimensionDialog}
              handleCancelDrawing={handleCancelDrawing}
              setSelectedTab={setSelectedTab}
              polarSettings={polarSettings}
              setShowPolarDialog={setShowPolarDialog}
              editingState={editingState}
              setEditingState={setEditingState}
              setShowCollabsDialog={setShowCollabsDialog}
            />
          </TabsContent>
          <TabsContent value='props'>
            <h2 className='text-md font-bold text-muted-foreground mb-1'>
              Properties
            </h2>
            <ShapeInputPanel
              selectedTool={selectedTool}
              drawingPoints={drawingPoints}
              completeShape={completeShape}
              setDrawingPoints={setDrawingPoints}
              handleCancelDrawing={handleCancelDrawing}
              setTempShape={setTempShape}
            />
          </TabsContent>
          <TabsContent value='ai'>
            <div>AI</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
