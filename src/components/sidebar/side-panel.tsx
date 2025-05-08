'use client';

import { Command, DrawingTool } from '@/constants';
import { CoordinatesInput } from './coordinates-input';
import { Properties } from './properties';
import { SelectedProperties } from './selected-properties';
import { Property, Point } from '@/types';
import { Shape } from '@/types';
import { SnapMode } from '../snap/useSnapping';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { Tools } from './tools';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Props = {
  selectedTool: DrawingTool;
  drawingPoints: Point[];
  propertyInput: Property;
  shapes: Shape[];
  mousePosition: Point | null;
  scale: number;
  offset: Point;
  selectedShapes: string[];
  coordinateInput: { x: string; y: string };
  tempShape: Shape | null;
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
  setPropertyInput: React.Dispatch<React.SetStateAction<Property>>;
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
  setSelectedTool: (tool: DrawingTool) => void;
  handleCancelDrawing: () => void;
  completeShape: (points: Point[], properties?: any) => void;
  setCoordinateInput: React.Dispatch<
    React.SetStateAction<{ x: string; y: string }>
  >;
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

export const SidePanel = ({
  selectedTool,
  drawingPoints,
  coordinateInput,
  tempShape,
  setDrawingPoints,
  setTempShape,
  setCoordinateInput,
  setPropertyInput,
  propertyInput,
  selectedShapes,
  shapes,
  mousePosition,
  scale,
  offset,
  handleCancelDrawing,
  completeShape,
  gridSize,
  setSelectedTool,
  setSelectedShapes,
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
  setSelectedCommand,
  selectedCommand,
}: Props) => {
  return (
    <div className='w-64 h-full flex flex-col border-r'>
      <div className='w-full border-b'>
        <div className='px-2 py-1 flex items-center justify-between'>
          <h1 className='font-black text-2xl'>BNA</h1>

          <ModeToggle variant='ghost' />
        </div>
      </div>

      <div className='p-2'>
        <Tabs defaultValue='tools' className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='tools'>Tools</TabsTrigger>
            <TabsTrigger value='properties'>Props</TabsTrigger>
            <TabsTrigger value='ai'>AI</TabsTrigger>
          </TabsList>
          <TabsContent value='tools'>
            <Tools
              gridSize={gridSize}
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
              setSelectedShapes={setSelectedShapes}
              selectedShapes={selectedShapes}
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
              selectedCommand={selectedCommand}
              setSelectedCommand={setSelectedCommand}
              handleCancelDrawing={handleCancelDrawing}
            />
          </TabsContent>
          <TabsContent value='properties'>
            <CoordinatesInput
              coordinateInput={coordinateInput}
              selectedTool={selectedTool}
              tempShape={tempShape}
              drawingPoints={drawingPoints}
              setDrawingPoints={setDrawingPoints}
              setTempShape={setTempShape}
              setCoordinateInput={setCoordinateInput}
              completeShape={completeShape}
            />

            <Properties
              selectedTool={selectedTool}
              drawingPoints={drawingPoints}
              propertyInput={propertyInput}
              setPropertyInput={setPropertyInput}
              handleCancelDrawing={handleCancelDrawing}
              completeShape={completeShape}
            />

            <SelectedProperties
              selectedTool={selectedTool}
              selectedShapes={selectedShapes}
              shapes={shapes}
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
