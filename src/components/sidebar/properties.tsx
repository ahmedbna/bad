'use client';

import { useState, useEffect, useMemo } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { Doc } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type Props = {
  selectedShapeIds: Id<'shapes'>[];
};

export const Properties = ({ selectedShapeIds }: Props) => {
  const [groupedShapes, setGroupedShapes] = useState<{
    byType: Record<string, (Doc<'shapes'> & { layer: Doc<'layers'> })[]>;
    byLayer: Record<string, (Doc<'shapes'> & { layer: Doc<'layers'> })[]>;
  }>({
    byType: {},
    byLayer: {},
  });

  const shapeIds = useMemo(() => [...selectedShapeIds], [selectedShapeIds]);
  const shapes = useQuery(api.shapes.getShapesByIds, { shapeIds }) ?? [];

  useEffect(() => {
    if (shapes.length === 0) {
      setGroupedShapes((prev) => {
        if (
          Object.keys(prev.byType).length === 0 &&
          Object.keys(prev.byLayer).length === 0
        ) {
          return prev;
        }
        return { byType: {}, byLayer: {} };
      });
      return;
    }

    const byType: Record<string, (Doc<'shapes'> & { layer: Doc<'layers'> })[]> =
      {};
    const byLayer: Record<
      string,
      (Doc<'shapes'> & { layer: Doc<'layers'> })[]
    > = {};

    shapes.forEach((shape) => {
      if (!byType[shape.type]) byType[shape.type] = [];
      byType[shape.type].push(shape);

      const layerName = shape.layer.name;
      if (!byLayer[layerName]) byLayer[layerName] = [];
      byLayer[layerName].push(shape);
    });

    setGroupedShapes((prev) => {
      const sameByType = JSON.stringify(prev.byType) === JSON.stringify(byType);
      const sameByLayer =
        JSON.stringify(prev.byLayer) === JSON.stringify(byLayer);

      if (sameByType && sameByLayer) return prev;
      return { byType, byLayer };
    });
  }, [shapes]);

  // Format values for display
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    if (value === null || value === undefined) {
      return '-';
    }
    return JSON.stringify(value);
  };

  // Renders a property row
  const PropertyRow = ({ label, value }: { label: string; value: any }) => (
    <div className='flex items-center justify-between py-1'>
      <span className='text-muted-foreground text-xs'>{label}:</span>
      <span className='font-medium text-xs'>{formatValue(value)}</span>
    </div>
  );

  // Renders a divider
  const Divider = () => <div className='w-full h-px bg-border/50 my-1' />;

  if (selectedShapeIds.length === 0) {
    return (
      <div className='w-full mt-2 bg-muted/40 rounded-md p-3 text-xs'>
        <span className='text-muted-foreground'>No shapes selected</span>
      </div>
    );
  }

  return (
    <div className='h-[calc(100vh-220px)] overflow-y-auto'>
      <div className='w-full space-y-2'>
        {/* Selection summary */}
        <div className='w-full bg-muted/40 rounded-md p-3 text-xs'>
          <PropertyRow
            label='Selected'
            value={`${selectedShapeIds.length} ${selectedShapeIds.length > 1 ? 'shapes' : 'shape'}`}
          />
          <Divider />
          <PropertyRow
            label='Types'
            value={
              Object.keys(groupedShapes.byType).length > 0
                ? Object.keys(groupedShapes.byType).join(', ')
                : 'None'
            }
          />
          <Divider />
          <PropertyRow
            label='Layers'
            value={
              Object.keys(groupedShapes.byLayer).length > 0
                ? Object.keys(groupedShapes.byLayer).join(', ')
                : 'None'
            }
          />
        </div>

        {/* Common properties section (when all shapes are the same type) */}
        {Object.keys(groupedShapes.byType).length === 1 && (
          <div className='w-full bg-muted/40 rounded-md p-3 text-xs'>
            <h3 className='font-semibold mb-2 capitalize'>
              {Object.keys(groupedShapes.byType)[0]} Properties
            </h3>

            {Object.keys(groupedShapes.byType).map((type) => {
              const shape = groupedShapes.byType[type][0];
              return (
                <div key={type}>
                  {/* Common properties */}
                  {shape.properties.strokeColor && (
                    <>
                      <PropertyRow
                        label='Stroke Color'
                        value={shape.properties.strokeColor}
                      />
                      <Divider />
                    </>
                  )}
                  {shape.properties.strokeWidth && (
                    <>
                      <PropertyRow
                        label='Stroke Width'
                        value={shape.properties.strokeWidth}
                      />
                      <Divider />
                    </>
                  )}
                  {shape.properties.fillColor && (
                    <>
                      <PropertyRow
                        label='Fill Color'
                        value={shape.properties.fillColor}
                      />
                      <Divider />
                    </>
                  )}

                  {/* Type-specific properties */}
                  {type === 'rectangle' && (
                    <>
                      <PropertyRow
                        label='Width'
                        value={shape.properties.width}
                      />
                      <Divider />
                      <PropertyRow
                        label='Length'
                        value={shape.properties.length}
                      />
                    </>
                  )}
                  {type === 'circle' && (
                    <PropertyRow
                      label='Radius'
                      value={shape.properties.radius}
                    />
                  )}
                  {type === 'ellipse' && (
                    <>
                      <PropertyRow
                        label='Radius X'
                        value={shape.properties.radiusX}
                      />
                      <Divider />
                      <PropertyRow
                        label='Radius Y'
                        value={shape.properties.radiusY}
                      />
                    </>
                  )}
                  {type === 'line' && (
                    <PropertyRow
                      label='Length'
                      value={shape.properties.length}
                    />
                  )}
                  {type === 'polygon' && (
                    <PropertyRow label='Sides' value={shape.properties.sides} />
                  )}
                  {type === 'arc' && (
                    <>
                      <PropertyRow
                        label='Start Angle'
                        value={shape.properties.startAngle}
                      />
                      <Divider />
                      <PropertyRow
                        label='End Angle'
                        value={shape.properties.endAngle}
                      />
                      <Divider />
                      <PropertyRow
                        label='Radius'
                        value={shape.properties.radius}
                      />
                    </>
                  )}
                  {type === 'text' && shape.properties.textParams && (
                    <>
                      <PropertyRow
                        label='Content'
                        value={shape.properties.textParams.content}
                      />
                      <Divider />
                      <PropertyRow
                        label='Font Size'
                        value={shape.properties.textParams.fontSize}
                      />
                      <Divider />
                      <PropertyRow
                        label='Font Family'
                        value={shape.properties.textParams.fontFamily}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Advanced shape details when multiple types are selected */}
        {Object.keys(groupedShapes.byType).length > 1 && (
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='types' className='border-0'>
              <AccordionTrigger className='py-2 px-3 bg-muted/40 rounded-md text-xs font-semibold'>
                Shape Types
              </AccordionTrigger>
              <AccordionContent className='pt-2'>
                {Object.entries(groupedShapes.byType).map(([type, shapes]) => (
                  <div key={type} className='mb-2 bg-muted/20 rounded-md p-2'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='font-medium capitalize'>{type}</span>
                      <Badge variant='outline' className='text-xs'>
                        {shapes.length}
                      </Badge>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {shapes[0].properties.width &&
                        `Width: ${formatValue(shapes[0].properties.width)}`}
                      {shapes[0].properties.length &&
                        `, Length: ${formatValue(shapes[0].properties.length)}`}
                      {shapes[0].properties.radius &&
                        `, Radius: ${formatValue(shapes[0].properties.radius)}`}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value='layers' className='border-0 mt-2'>
              <AccordionTrigger className='py-2 px-3 bg-muted/40 rounded-md text-xs font-semibold'>
                Layers
              </AccordionTrigger>
              <AccordionContent className='pt-2'>
                {Object.entries(groupedShapes.byLayer).map(
                  ([layerName, shapes]) => (
                    <div
                      key={layerName}
                      className='mb-2 bg-muted/20 rounded-md p-2'
                    >
                      <div className='flex items-center justify-between mb-1'>
                        <div className='flex items-center'>
                          {shapes[0].layer.color && (
                            <div
                              className='w-3 h-3 rounded-full mr-2'
                              style={{ backgroundColor: shapes[0].layer.color }}
                            />
                          )}
                          <span className='font-medium'>{layerName}</span>
                        </div>
                        <Badge variant='outline' className='text-xs'>
                          {shapes.length}
                        </Badge>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Line width: {shapes[0].layer.lineWidth}, Line type:{' '}
                        {shapes[0].layer.lineType}
                      </div>
                    </div>
                  )
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Position information for single shape selection */}
        {selectedShapeIds.length === 1 && shapes.length === 1 && (
          <div className='w-full bg-muted/40 rounded-md p-3 text-xs'>
            <h3 className='font-semibold mb-2'>Position</h3>
            {shapes[0].points.length > 0 && (
              <>
                <PropertyRow
                  label='First Point'
                  value={`(${shapes[0].points[0].x.toFixed(2)}, ${shapes[0].points[0].y.toFixed(2)})`}
                />
                {shapes[0].points.length > 1 && (
                  <>
                    <Divider />
                    <PropertyRow
                      label='Last Point'
                      value={`(${shapes[0].points[shapes[0].points.length - 1].x.toFixed(2)}, ${shapes[0].points[shapes[0].points.length - 1].y.toFixed(2)})`}
                    />
                  </>
                )}
              </>
            )}
            {shapes[0].properties.center &&
              shapes[0].properties.center.length > 0 && (
                <>
                  <Divider />
                  <PropertyRow
                    label='Center'
                    value={`(${shapes[0].properties.center[0].x.toFixed(2)}, ${shapes[0].properties.center[0].y.toFixed(2)})`}
                  />
                </>
              )}
          </div>
        )}

        {/* Measurements section for single shape */}
        {selectedShapeIds.length === 1 && shapes.length === 1 && (
          <div className='w-full bg-muted/40 rounded-md p-3 text-xs'>
            <h3 className='font-semibold mb-2'>Measurements</h3>
            {shapes[0].properties.area && (
              <>
                <PropertyRow
                  label='Area'
                  value={`${shapes[0].properties.area.toFixed(2)} sq units`}
                />
                <Divider />
              </>
            )}
            {shapes[0].properties.perimeter && (
              <>
                <PropertyRow
                  label='Perimeter'
                  value={`${shapes[0].properties.perimeter.toFixed(2)} units`}
                />
                <Divider />
              </>
            )}
            {shapes[0].properties.length && (
              <>
                <PropertyRow
                  label='Length'
                  value={`${shapes[0].properties.length.toFixed(2)} units`}
                />
                <Divider />
              </>
            )}
            {shapes[0].properties.diameter && (
              <PropertyRow
                label='Diameter'
                value={`${shapes[0].properties.diameter.toFixed(2)} units`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
