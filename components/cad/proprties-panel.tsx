'use client';

import React, { useState, useEffect } from 'react';
import { useCADContext } from '@/hooks/CADContext';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

// Color options
const colorOptions = [
  { value: '#000000', label: 'Black' },
  { value: '#FF0000', label: 'Red' },
  { value: '#00FF00', label: 'Green' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#FF00FF', label: 'Magenta' },
  { value: '#00FFFF', label: 'Cyan' },
  { value: '#FF8000', label: 'Orange' },
  { value: '#8000FF', label: 'Purple' },
];

// Line width options
const lineWidthOptions = [0.5, 1, 1.5, 2, 2.5, 3];

// Interface for common editable properties
interface EntityEditableProperties {
  type?: string;
  layer?: string | null;
  properties?: {
    strokeColor?: string | null;
    strokeWidth?: number | null;
    fillColor?: string | null;
  };
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  topLeft?: { x: number; y: number };
  width?: number;
  height?: number;
  position?: { x: number; y: number };
  content?: string;
  fontSize?: number;
  fontFamily?: string;
}

export const PropertiesPanel = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [entityProperties, setEntityProperties] =
    useState<EntityEditableProperties>({});

  const {
    entities,
    selectedEntities,
    updateEntity,
    layers,
    currentLayer,
    setCurrentLayer,
  } = useCADContext();

  // Update entity properties when selection changes
  useEffect(() => {
    if (selectedEntities.length === 1) {
      // Single entity selected, get its properties
      const entity = entities.find((e) => e.id === selectedEntities[0]);
      if (entity) {
        setEntityProperties({
          ...entity,
        });
      }
    } else if (selectedEntities.length > 1) {
      // Multiple entities selected, show common properties
      const commonProps: EntityEditableProperties = {};

      // Get common properties
      selectedEntities.forEach((id, index) => {
        const entity = entities.find((e) => e.id === id);
        if (!entity) return;

        if (index === 0) {
          // For first entity, copy all properties
          commonProps.type = entity.type;
          commonProps.layer = entity.layer;
          commonProps.properties = { ...entity.properties };
        } else {
          // For subsequent entities, only keep matching properties
          if (commonProps.type !== entity.type) {
            commonProps.type = 'multiple';
          }

          if (commonProps.layer !== entity.layer) {
            commonProps.layer = null;
          }

          // Check properties
          if (commonProps.properties) {
            if (
              commonProps.properties.strokeColor !==
              entity.properties.strokeColor
            ) {
              commonProps.properties.strokeColor = null;
            }

            if (
              commonProps.properties.strokeWidth !==
              entity.properties.strokeWidth
            ) {
              commonProps.properties.strokeWidth = null;
            }

            if (
              commonProps.properties.fillColor !== entity.properties.fillColor
            ) {
              commonProps.properties.fillColor = null;
            }
          }
        }
      });

      setEntityProperties(commonProps);
    } else {
      // No entities selected, clear properties
      setEntityProperties({});
    }
  }, [selectedEntities, entities]);

  const handlePropertyChange = (property: string, value: any) => {
    // Handle nested properties
    if (property.startsWith('properties.')) {
      const propName = property.split('.')[1];
      setEntityProperties((prev) => ({
        ...prev,
        properties: {
          ...prev.properties,
          [propName]: value,
        },
      }));

      // Update all selected entities
      selectedEntities.forEach((id) => {
        updateEntity({
          id, // @ts-ignore
          properties: {
            [propName]: value,
          },
        });
      });
      return;
    }

    // Update local state for direct properties
    setEntityProperties((prev) => ({
      ...prev,
      [property]: value,
    }));

    // Update all selected entities
    selectedEntities.forEach((id) => {
      updateEntity({
        id,
        [property]: value,
      });
    });
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderCommonProperties = () => {
    if (selectedEntities.length === 0) {
      return (
        <div className='p-4 text-center text-gray-500'>
          No entities selected
        </div>
      );
    }

    return (
      <div className='space-y-4 p-4'>
        {/* Stroke Color */}
        <div className='space-y-2'>
          <Label htmlFor='strokeColor'>Stroke Color:</Label>
          <Select
            value={entityProperties.properties?.strokeColor || ''}
            onValueChange={(value) =>
              handlePropertyChange('properties.strokeColor', value)
            }
          >
            <SelectTrigger id='strokeColor'>
              <SelectValue placeholder='Select color' />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className='flex items-center'>
                    <div
                      className='h-3 w-3 rounded-full mr-2'
                      style={{ backgroundColor: option.value }}
                    />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stroke Width */}
        <div className='space-y-2'>
          <Label htmlFor='strokeWidth'>Stroke Width:</Label>
          <Select
            value={entityProperties.properties?.strokeWidth?.toString() || ''}
            onValueChange={(value) =>
              handlePropertyChange('properties.strokeWidth', parseFloat(value))
            }
          >
            <SelectTrigger id='strokeWidth'>
              <SelectValue placeholder='Select width' />
            </SelectTrigger>
            <SelectContent>
              {lineWidthOptions.map((width) => (
                <SelectItem key={width} value={width.toString()}>
                  {width}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fill Color (for applicable entities) */}
        {(entityProperties.type === 'circle' ||
          entityProperties.type === 'rectangle' ||
          entityProperties.type === 'multiple') && (
          <div className='space-y-2'>
            <Label htmlFor='fillColor'>Fill Color:</Label>
            <Select
              value={entityProperties.properties?.fillColor || ''}
              onValueChange={(value) =>
                handlePropertyChange('properties.fillColor', value)
              }
            >
              <SelectTrigger id='fillColor'>
                <SelectValue placeholder='Select color' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>None</SelectItem>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className='flex items-center'>
                      <div
                        className='h-3 w-3 rounded-full mr-2'
                        style={{ backgroundColor: option.value }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Layer */}
        <div className='space-y-2'>
          <Label htmlFor='layer'>Layer:</Label>
          <Select
            value={entityProperties.layer || ''}
            onValueChange={(value) => handlePropertyChange('layer', value)}
          >
            <SelectTrigger id='layer'>
              <SelectValue placeholder='Select layer' />
            </SelectTrigger>
            <SelectContent>
              {layers.map((layer) => (
                <SelectItem key={layer.id} value={layer.id}>
                  {layer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderSpecificProperties = () => {
    if (
      !entityProperties.type ||
      entityProperties.type === 'multiple' ||
      selectedEntities.length !== 1
    ) {
      return null;
    }

    switch (entityProperties.type) {
      case 'line':
        return (
          <div className='space-y-4 p-4 pt-0'>
            <div className='grid grid-cols-2 gap-2'>
              <div className='space-y-1'>
                <Label htmlFor='startX'>Start X:</Label>
                <Input
                  id='startX'
                  type='number'
                  value={entityProperties.start?.x || 0}
                  onChange={(e) =>
                    handlePropertyChange('start', {
                      ...entityProperties.start,
                      x: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='startY'>Start Y:</Label>
                <Input
                  id='startY'
                  type='number'
                  value={entityProperties.start?.y || 0}
                  onChange={(e) =>
                    handlePropertyChange('start', {
                      ...entityProperties.start,
                      y: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='endX'>End X:</Label>
                <Input
                  id='endX'
                  type='number'
                  value={entityProperties.end?.x || 0}
                  onChange={(e) =>
                    handlePropertyChange('end', {
                      ...entityProperties.end,
                      x: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='endY'>End Y:</Label>
                <Input
                  id='endY'
                  type='number'
                  value={entityProperties.end?.y || 0}
                  onChange={(e) =>
                    handlePropertyChange('end', {
                      ...entityProperties.end,
                      y: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
        );

      case 'circle':
        return (
          <div className='space-y-4 p-4 pt-0'>
            <div className='grid grid-cols-2 gap-2'>
              <div className='space-y-1'>
                <Label htmlFor='centerX'>Center X:</Label>
                <Input
                  id='centerX'
                  type='number'
                  value={entityProperties.center?.x || 0}
                  onChange={(e) =>
                    handlePropertyChange('center', {
                      ...entityProperties.center,
                      x: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='centerY'>Center Y:</Label>
                <Input
                  id='centerY'
                  type='number'
                  value={entityProperties.center?.y || 0}
                  onChange={(e) =>
                    handlePropertyChange('center', {
                      ...entityProperties.center,
                      y: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1 col-span-2'>
                <Label htmlFor='radius'>Radius:</Label>
                <Input
                  id='radius'
                  type='number'
                  value={entityProperties.radius || 0}
                  onChange={(e) =>
                    handlePropertyChange('radius', parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
        );

      case 'rectangle':
        return (
          <div className='space-y-4 p-4 pt-0'>
            <div className='grid grid-cols-2 gap-2'>
              <div className='space-y-1'>
                <Label htmlFor='topLeftX'>Top-Left X:</Label>
                <Input
                  id='topLeftX'
                  type='number'
                  value={entityProperties.topLeft?.x || 0}
                  onChange={(e) =>
                    handlePropertyChange('topLeft', {
                      ...entityProperties.topLeft,
                      x: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='topLeftY'>Top-Left Y:</Label>
                <Input
                  id='topLeftY'
                  type='number'
                  value={entityProperties.topLeft?.y || 0}
                  onChange={(e) =>
                    handlePropertyChange('topLeft', {
                      ...entityProperties.topLeft,
                      y: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='width'>Width:</Label>
                <Input
                  id='width'
                  type='number'
                  value={entityProperties.width || 0}
                  onChange={(e) =>
                    handlePropertyChange('width', parseFloat(e.target.value))
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='height'>Height:</Label>
                <Input
                  id='height'
                  type='number'
                  value={entityProperties.height || 0}
                  onChange={(e) =>
                    handlePropertyChange('height', parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
        );

      case 'polyline':
        return (
          <div className='space-y-4 p-4 pt-0'>
            <div className='space-y-2'>
              <Label>Points:</Label>
              <div className='text-sm text-gray-500'>
                Polyline points cannot be edited directly from this panel.
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className='space-y-4 p-4 pt-0'>
            <div className='grid grid-cols-2 gap-2'>
              <div className='space-y-1'>
                <Label htmlFor='positionX'>Position X:</Label>
                <Input
                  id='positionX'
                  type='number'
                  value={entityProperties.position?.x || 0}
                  onChange={(e) =>
                    handlePropertyChange('position', {
                      ...entityProperties.position,
                      x: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='positionY'>Position Y:</Label>
                <Input
                  id='positionY'
                  type='number'
                  value={entityProperties.position?.y || 0}
                  onChange={(e) =>
                    handlePropertyChange('position', {
                      ...entityProperties.position,
                      y: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-1 col-span-2'>
                <Label htmlFor='content'>Text:</Label>
                <Input
                  id='content'
                  type='text'
                  value={entityProperties.content || ''}
                  onChange={(e) =>
                    handlePropertyChange('content', e.target.value)
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='fontSize'>Font Size:</Label>
                <Input
                  id='fontSize'
                  type='number'
                  value={entityProperties.fontSize || 12}
                  onChange={(e) =>
                    handlePropertyChange('fontSize', parseFloat(e.target.value))
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='fontFamily'>Font Family:</Label>
                <Select
                  value={entityProperties.fontFamily || 'Arial'}
                  onValueChange={(value) =>
                    handlePropertyChange('fontFamily', value)
                  }
                >
                  <SelectTrigger id='fontFamily'>
                    <SelectValue placeholder='Select font' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Arial'>Arial</SelectItem>
                    <SelectItem value='Times New Roman'>
                      Times New Roman
                    </SelectItem>
                    <SelectItem value='Courier New'>Courier New</SelectItem>
                    <SelectItem value='Georgia'>Georgia</SelectItem>
                    <SelectItem value='Verdana'>Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white border-l border-gray-200 h-full transition-all ${
        isExpanded ? 'w-64' : 'w-8'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={handleToggleExpand}
        className='h-8 w-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200'
      >
        {isExpanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {isExpanded && (
        <div className='h-[calc(100%-32px)] overflow-y-auto'>
          <h2 className='text-lg font-medium p-4 border-b'>Properties</h2>

          <Accordion type='single' collapsible defaultValue='common'>
            <AccordionItem value='common'>
              <AccordionTrigger className='px-4'>
                Common Properties
              </AccordionTrigger>
              <AccordionContent>{renderCommonProperties()}</AccordionContent>
            </AccordionItem>

            {entityProperties.type && entityProperties.type !== 'multiple' && (
              <AccordionItem value='specific'>
                <AccordionTrigger className='px-4'>
                  {entityProperties.type.charAt(0).toUpperCase() +
                    entityProperties.type.slice(1)}{' '}
                  Properties
                </AccordionTrigger>
                <AccordionContent>
                  {renderSpecificProperties()}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      )}
    </div>
  );
};
