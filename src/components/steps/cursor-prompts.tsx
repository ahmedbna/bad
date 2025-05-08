import React from 'react';
import { DrawingTool } from '@/constants';
import { Point } from '@/types';

interface CursorPromptProps {
  mousePosition: Point | null;
  selectedTool: DrawingTool;
  drawingStep: number;
  coordinateInput: { x: string; y: string };
  propertyInput: {
    length: string;
    width: string;
    height: string;
    radius: string;
    diameter: string;
    direction: string;
    radiusX: string;
    radiusY: string;
    startAngle: string;
    endAngle: string;
    sides: string;
    rotation: string;
    tension: string;
  };
  handleInputChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    inputType: string
  ) => void;
  handleInputKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: string
  ) => void;
}

export const CursorPrompt: React.FC<CursorPromptProps> = ({
  mousePosition,
  selectedTool,
  drawingStep,
  coordinateInput,
  propertyInput,
  handleInputChange,
  handleInputKeyDown,
}) => {
  if (!mousePosition) return null;

  const getPromptText = () => {
    switch (selectedTool) {
      case 'line':
        return drawingStep === 0
          ? 'Specify first point:'
          : 'Specify next point or [Length]:';
      case 'polyline':
        return drawingStep === 0
          ? 'Specify first point:'
          : 'Specify next point or [Close]:';
      case 'rectangle':
        return drawingStep === 0
          ? 'Specify first corner:'
          : 'Specify other corner or [Width/Height]:';
      case 'circle':
        return drawingStep === 0
          ? 'Specify center point:'
          : 'Specify radius or [Diameter]:';
      case 'arc':
        return getArcPrompt(drawingStep);
      case 'ellipse':
        return drawingStep === 0
          ? 'Specify center point:'
          : drawingStep === 1
            ? 'Specify axis endpoint or [RadiusX]:'
            : 'Specify other axis or [RadiusY]:';
      case 'polygon':
        return drawingStep === 0
          ? 'Specify center point:'
          : 'Specify radius or [Sides]:';
      case 'spline':
        return drawingStep === 0
          ? 'Specify first point:'
          : 'Specify next point or [Tension] (double-click to end):';
      case 'text':
        return 'Specify insertion point:';
      case 'dimension':
        return drawingStep === 0
          ? 'Specify first extension line origin:'
          : 'Specify second extension line origin:';
      default:
        return 'Click to place point:';
    }
  };

  const getArcPrompt = (step: number) => {
    switch (step) {
      case 0:
        return 'Specify start point:';
      case 1:
        return 'Specify second point:';
      case 2:
        return 'Specify end point:';
      default:
        return 'Specify point:';
    }
  };

  const getInputField = () => {
    switch (selectedTool) {
      case 'line':
        if (drawingStep === 1) {
          return (
            <>
              <input
                type='text'
                placeholder='Length'
                value={propertyInput.length}
                onChange={(e) => handleInputChange(e, 'length')}
                onKeyDown={(e) => handleInputKeyDown(e, 'length')}
                className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
              />
            </>
          );
        }
        break;
      case 'rectangle':
        if (drawingStep === 1) {
          return (
            <div className='flex gap-1'>
              <input
                type='text'
                placeholder='Width'
                value={propertyInput.width}
                onChange={(e) => handleInputChange(e, 'width')}
                onKeyDown={(e) => handleInputKeyDown(e, 'width')}
                className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
              />
              <input
                type='text'
                placeholder='Height'
                value={propertyInput.height}
                onChange={(e) => handleInputChange(e, 'height')}
                onKeyDown={(e) => handleInputKeyDown(e, 'height')}
                className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
              />
            </div>
          );
        }
        break;
      case 'circle':
        if (drawingStep === 1) {
          return (
            <div className='flex gap-1'>
              <input
                type='text'
                placeholder='Radius'
                value={propertyInput.radius}
                onChange={(e) => handleInputChange(e, 'radius')}
                onKeyDown={(e) => handleInputKeyDown(e, 'radius')}
                className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
              />
              <input
                type='text'
                placeholder='Diameter'
                value={propertyInput.diameter}
                onChange={(e) => handleInputChange(e, 'diameter')}
                onKeyDown={(e) => handleInputKeyDown(e, 'diameter')}
                className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
              />
            </div>
          );
        }
        break;
      case 'ellipse':
        if (drawingStep === 1) {
          return (
            <input
              type='text'
              placeholder='RadiusX'
              value={propertyInput.radiusX}
              onChange={(e) => handleInputChange(e, 'radiusX')}
              onKeyDown={(e) => handleInputKeyDown(e, 'radiusX')}
              className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
            />
          );
        } else if (drawingStep === 2) {
          return (
            <input
              type='text'
              placeholder='RadiusY'
              value={propertyInput.radiusY}
              onChange={(e) => handleInputChange(e, 'radiusY')}
              onKeyDown={(e) => handleInputKeyDown(e, 'radiusY')}
              className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
            />
          );
        }
        break;
      case 'polygon':
        if (drawingStep === 1) {
          return (
            <div className='flex gap-1'>
              <input
                type='text'
                placeholder='Radius'
                value={propertyInput.radius}
                onChange={(e) => handleInputChange(e, 'radius')}
                onKeyDown={(e) => handleInputKeyDown(e, 'radius')}
                className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
              />
              <input
                type='text'
                placeholder='Sides'
                value={propertyInput.sides}
                onChange={(e) => handleInputChange(e, 'sides')}
                onKeyDown={(e) => handleInputKeyDown(e, 'sides')}
                className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
              />
            </div>
          );
        }
        break;
      case 'spline':
        if (drawingStep > 0) {
          return (
            <input
              type='text'
              placeholder='Tension'
              value={propertyInput.tension}
              onChange={(e) => handleInputChange(e, 'tension')}
              onKeyDown={(e) => handleInputKeyDown(e, 'tension')}
              className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
            />
          );
        }
        break;
    }

    // Default coordinate input
    return (
      <div className='flex gap-1'>
        <input
          type='text'
          placeholder='X'
          value={coordinateInput.x}
          onChange={(e) => handleInputChange(e, 'x')}
          onKeyDown={(e) => handleInputKeyDown(e, 'x')}
          className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
        />
        <input
          type='text'
          placeholder='Y'
          value={coordinateInput.y}
          onChange={(e) => handleInputChange(e, 'y')}
          onKeyDown={(e) => handleInputKeyDown(e, 'y')}
          className='w-20 px-1 bg-white/90 border border-gray-300 rounded'
        />
      </div>
    );
  };

  return (
    <div
      className='absolute pointer-events-none z-30 flex flex-col gap-1'
      style={{
        left: mousePosition.x + 20,
        top: mousePosition.y - 5,
      }}
    >
      <div className='bg-black/70 text-white px-2 py-1 rounded text-sm whitespace-nowrap'>
        {getPromptText()}
      </div>
      <div className='pointer-events-auto'>{getInputField()}</div>
    </div>
  );
};
