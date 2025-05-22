'use client';

import Link from 'next/link';
import { DrawingTool } from '@/constants';
import { Point, PolarSettings, ShapeProperties } from '@/types';
import { SnapMode } from '../snap/useSnapping';
import { Tools } from './tools';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShapeInputPanel } from './shape-input-panel';
import { createInitialEditingState, EditingState } from '../editing/constants';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Properties } from './properties';
import { AIChat } from '../ai/ai-chat';
import { RefObject } from 'react';

type Props = {
  project: Doc<'projects'> & { layers: Doc<'layers'>[] };
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
  setTempShape: React.Dispatch<
    React.SetStateAction<(Doc<'shapes'> & { layer: Doc<'layers'> }) | null>
  >;
  polarSettings: PolarSettings;
  setShowPolarDialog: React.Dispatch<React.SetStateAction<boolean>>;
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  setShowCollabsDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLayersDialog: React.Dispatch<React.SetStateAction<boolean>>;
  currentLayerId: Id<'layers'>;
  selectedShapeIds: Id<'shapes'>[];
  selectedShapes: Doc<'shapes'>[];
  setPendingAiShapes: React.Dispatch<React.SetStateAction<any>[]>;
  pendingAiShapes: any[];
  lineLengthRef: RefObject<HTMLInputElement | null>;
  lineAngleRef: RefObject<HTMLInputElement | null>;
  rectangleWidthRef: RefObject<HTMLInputElement | null>;
  rectangleLengthRef: RefObject<HTMLInputElement | null>;
  circleRadiusRef: RefObject<HTMLInputElement | null>;
  circleDiameterRef: RefObject<HTMLInputElement | null>;
  arcRadiusRef: RefObject<HTMLInputElement | null>;
  arcStartAngleRef: RefObject<HTMLInputElement | null>;
  arcEndAngleRef: RefObject<HTMLInputElement | null>;
  polygonRadiusRef: RefObject<HTMLInputElement | null>;
  polygonSidesRef: RefObject<HTMLInputElement | null>;
  ellipseRadiusXRef: RefObject<HTMLInputElement | null>;
  ellipseRadiusYRef: RefObject<HTMLInputElement | null>;
  ellipseRotationRef: RefObject<HTMLInputElement | null>;
  splineTensionRef: RefObject<HTMLInputElement | null>;
  xCoordinatenRef: RefObject<HTMLInputElement | null>;
  yCoordinatenRef: RefObject<HTMLInputElement | null>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => void;
  step: number;
  propertyInput: ShapeProperties;
  coordinateInput: Point;
  setCoordinateInput: React.Dispatch<React.SetStateAction<Point>>;
  setPropertyInput: React.Dispatch<React.SetStateAction<ShapeProperties>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

export const SidePanel = ({
  project,
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
  setShowLayersDialog,
  currentLayerId,
  selectedShapeIds,
  selectedShapes,
  pendingAiShapes,
  setPendingAiShapes,
  lineLengthRef,
  lineAngleRef,
  rectangleWidthRef,
  rectangleLengthRef,
  circleRadiusRef,
  circleDiameterRef,
  arcRadiusRef,
  arcStartAngleRef,
  arcEndAngleRef,
  polygonRadiusRef,
  polygonSidesRef,
  ellipseRadiusXRef,
  ellipseRadiusYRef,
  ellipseRotationRef,
  splineTensionRef,
  xCoordinatenRef,
  yCoordinatenRef,
  handleInputChange,
  step,
  propertyInput,
  coordinateInput,
  setCoordinateInput,
  setPropertyInput,
  setStep,
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
            <TabsTrigger
              value='props'
              onClick={() => {
                handleCancelDrawing();
                setSelectedTool('select');
                setEditingState(createInitialEditingState());
              }}
            >
              Props
            </TabsTrigger>
            <TabsTrigger
              value='ai'
              onClick={() => {
                handleCancelDrawing();
                setSelectedTool('select');
                setEditingState(createInitialEditingState());
              }}
            >
              AI
            </TabsTrigger>
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
              setShowLayersDialog={setShowLayersDialog}
              currentLayerId={currentLayerId}
            />
          </TabsContent>
          <TabsContent value='props'>
            <h2 className='text-md font-bold text-muted-foreground mb-1'>
              Properties
            </h2>

            {selectedTool === 'select' ? (
              <Properties selectedShapeIds={selectedShapeIds} />
            ) : null}

            <ShapeInputPanel
              selectedTool={selectedTool}
              drawingPoints={drawingPoints}
              completeShape={completeShape}
              setDrawingPoints={setDrawingPoints}
              handleCancelDrawing={handleCancelDrawing}
              setTempShape={setTempShape}
              lineLengthRef={lineLengthRef}
              lineAngleRef={lineAngleRef}
              rectangleWidthRef={rectangleWidthRef}
              rectangleLengthRef={rectangleLengthRef}
              circleRadiusRef={circleRadiusRef}
              circleDiameterRef={circleDiameterRef}
              arcRadiusRef={arcRadiusRef}
              arcStartAngleRef={arcStartAngleRef}
              arcEndAngleRef={arcEndAngleRef}
              polygonRadiusRef={polygonRadiusRef}
              polygonSidesRef={polygonSidesRef}
              ellipseRadiusXRef={ellipseRadiusXRef}
              ellipseRadiusYRef={ellipseRadiusYRef}
              ellipseRotationRef={ellipseRotationRef}
              splineTensionRef={splineTensionRef}
              xCoordinatenRef={xCoordinatenRef}
              yCoordinatenRef={yCoordinatenRef}
              handleInputChange={handleInputChange}
              propertyInput={propertyInput}
              coordinateInput={coordinateInput}
              setCoordinateInput={setCoordinateInput}
              setPropertyInput={setPropertyInput}
              setStep={setStep}
              step={step}
            />
          </TabsContent>
          <TabsContent value='ai'>
            <AIChat
              project={project}
              completeShape={completeShape}
              selectedShapes={selectedShapes}
              pendingAiShapes={pendingAiShapes}
              setPendingAiShapes={setPendingAiShapes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
