'use client';

import React from 'react';
import { SnapMode, SnapResult } from '../snap/useSnapping';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

type SnapControlsProps = {
  snapSettings: {
    enabled: boolean;
    modes: Set<SnapMode>;
    threshold: number;
    gridSize: number;
  };
  toggleSnapMode: (mode: SnapMode) => void;
  activeSnapResult: SnapResult | null;
};

export const SnapControls = ({
  snapSettings,
  toggleSnapMode,
  activeSnapResult,
}: SnapControlsProps) => {
  // All available snap modes grouped by category
  const snapModeGroups = {
    Points: [
      { mode: SnapMode.ENDPOINT, label: 'Endpoints' },
      { mode: SnapMode.MIDPOINT, label: 'Midpoints' },
      { mode: SnapMode.NODE, label: 'Nodes' },
    ],
    Objects: [
      { mode: SnapMode.CENTER, label: 'Centers' },
      { mode: SnapMode.QUADRANT, label: 'Quadrants' },
    ],
    Relations: [
      { mode: SnapMode.INTERSECTION, label: 'Intersections' },
      { mode: SnapMode.EXTENSION, label: 'Extensions' },
      { mode: SnapMode.PERPENDICULAR, label: 'Perpendicular' },
      { mode: SnapMode.TANGENT, label: 'Tangent' },
    ],
    Other: [
      { mode: SnapMode.NEAREST, label: 'Nearest' },
      { mode: SnapMode.GRID, label: 'Grid' },
    ],
  };

  // Flatten modes for finding by mode
  const allSnapModes = Object.values(snapModeGroups).flat();

  return (
    <div className='mb-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-sm font-medium'>Snapping</h3>
        <div className='flex items-center space-x-2'>
          <Switch
            checked={snapSettings.enabled}
            onCheckedChange={() => {
              // Toggle all modes if there are none selected
              if (snapSettings.modes.size === 0) {
                allSnapModes.forEach(({ mode }) => toggleSnapMode(mode));
              } else {
                // Otherwise toggle the enabled state
                toggleSnapMode(SnapMode.NONE); // Special case to toggle all modes
              }
            }}
            id='snap-toggle'
          />
          <Label htmlFor='snap-toggle' className='text-xs'>
            {snapSettings.enabled ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      </div>

      <Card className='mb-4'>
        <CardContent className='p-3'>
          {Object.entries(snapModeGroups).map(
            ([groupName, modes], index, arr) => (
              <React.Fragment key={groupName}>
                <div className='py-2'>
                  <h4 className='text-xs font-medium text-muted-foreground mb-2'>
                    {groupName}
                  </h4>
                  <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
                    {modes.map(({ mode, label }) => (
                      <div key={mode} className='flex items-center space-x-2'>
                        <Checkbox
                          id={`snap-${mode}`}
                          checked={
                            snapSettings.enabled && snapSettings.modes.has(mode)
                          }
                          onCheckedChange={() => toggleSnapMode(mode)}
                          disabled={!snapSettings.enabled}
                        />
                        <Label
                          htmlFor={`snap-${mode}`}
                          className='text-xs font-normal'
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {index < arr.length - 1 && <Separator className='my-1' />}
              </React.Fragment>
            )
          )}
        </CardContent>
      </Card>

      {/* Snap Settings */}
      {snapSettings.enabled && (
        <Card className='mb-4'>
          <CardHeader className='p-3 pb-1'>
            <CardTitle className='text-xs font-medium'>Settings</CardTitle>
          </CardHeader>
          <CardContent className='p-3 pt-0 space-y-4'>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <Label htmlFor='snap-threshold' className='text-xs'>
                  Snap threshold
                </Label>
                <span className='text-xs text-muted-foreground'>
                  {snapSettings.threshold}px
                </span>
              </div>
              <Slider
                id='snap-threshold'
                min={1}
                max={20}
                step={1}
                value={[snapSettings.threshold]}
                // onChange={(value) => {
                //   // You'll need to add a setSnapSettings prop to handle this
                // }}
                className='w-full'
              />
            </div>

            {snapSettings.modes.has(SnapMode.GRID) && (
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <Label htmlFor='grid-size' className='text-xs'>
                    Grid size
                  </Label>
                  <span className='text-xs text-muted-foreground'>
                    {snapSettings.gridSize}px
                  </span>
                </div>
                <Slider
                  id='grid-size'
                  min={5}
                  max={50}
                  step={5}
                  value={[snapSettings.gridSize]}
                  // onChange={(value) => {
                  //   // You'll need to add a setSnapSettings prop to handle this
                  // }}
                  className='w-full'
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current snap state */}
      {activeSnapResult && activeSnapResult.snapMode !== SnapMode.NONE && (
        <Card className='mb-3'>
          <CardHeader className='p-3 pb-1'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-xs font-medium'>
                Snap Indicator
              </CardTitle>
              <Badge variant='secondary' className='text-xs h-5'>
                {allSnapModes.find((m) => m.mode === activeSnapResult.snapMode)
                  ?.label || 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='p-3 pt-0'>
            <div className='space-y-1 text-xs'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Position</span>
                <span>
                  [{activeSnapResult.point.x.toFixed(1)},{' '}
                  {activeSnapResult.point.y.toFixed(1)}]
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Distance</span>
                <span>{activeSnapResult.distance.toFixed(1)}px</span>
              </div>

              {activeSnapResult.snapInfo && (
                <>
                  <Separator className='my-2' />
                  {activeSnapResult.snapInfo.shapeId && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Shape</span>
                      <span>
                        {activeSnapResult.snapInfo.shapeId.substring(0, 6)}...
                      </span>
                    </div>
                  )}
                  {activeSnapResult.snapInfo.pointIndex !== undefined && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Point</span>
                      <span>{activeSnapResult.snapInfo.pointIndex}</span>
                    </div>
                  )}
                  {activeSnapResult.snapInfo.quadrant && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Quadrant</span>
                      <span>
                        {activeSnapResult.snapInfo.quadrant.toUpperCase()}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
