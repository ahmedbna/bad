import { DrawingTool } from '@/types/drawing-tool';
import { CoordinatesInput } from './coordinates-input';
import { Properties } from './properties';
import { SelectedProperties } from './selected-properties';
import { Point } from '@/types/point';
import { Property } from '@/types/property';
import { Shape } from '@/types/shape';
import { Status } from './status';

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
  handleCancelDrawing: () => void;
  completeShape: (points: Point[], properties?: any) => void;
  setCoordinateInput: React.Dispatch<
    React.SetStateAction<{ x: string; y: string }>
  >;
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>;
  setPropertyInput: React.Dispatch<React.SetStateAction<Property>>;
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
}: Props) => {
  return (
    <div className='w-64 border-l p-4 overflow-y-auto'>
      <h3 className='font-semibold mb-4'>Properties</h3>

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

      <Status
        selectedTool={selectedTool}
        mousePosition={mousePosition}
        shapes={shapes}
        scale={scale}
        offset={offset}
      />
    </div>
  );
};
