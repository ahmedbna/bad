'use client';

import React, { useState, useEffect } from 'react';
import { useCADContext } from '@/hooks/CADContext';

export default function StatusBar() {
  const { viewState, currentTool, currentLayer, layers } = useCADContext();
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [screenCoords, setScreenCoords] = useState({ x: 0, y: 0 });

  // Get current layer name
  const currentLayerName =
    layers.find((l) => l.id === currentLayer)?.name || 'Default';

  // Update mouse coordinates on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Get canvas element
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      // Get canvas bounds
      const rect = canvas.getBoundingClientRect();

      // Check if mouse is over canvas
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        // Calculate mouse position relative to canvas
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        // Save screen coordinates
        setScreenCoords({ x: canvasX, y: canvasY });

        // Transform to world coordinates
        const worldX = (canvasX - viewState.panOffset.x) / viewState.zoom;
        const worldY = (canvasY - viewState.panOffset.y) / viewState.zoom;

        // Update state with world coordinates
        setMouseCoords({ x: worldX, y: worldY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [viewState.zoom, viewState.panOffset.x, viewState.panOffset.y]);

  return (
    <div className='flex items-center justify-between bg-slate-800 text-white px-4 py-1 text-xs'>
      <div className='flex items-center space-x-4'>
        <div>
          X: {mouseCoords.x.toFixed(2)}, Y: {mouseCoords.y.toFixed(2)}
        </div>

        <div>
          Screen: {screenCoords.x.toFixed(0)}, {screenCoords.y.toFixed(0)}
        </div>
      </div>

      <div className='flex items-center space-x-4'>
        <div>Zoom: {(viewState.zoom * 100).toFixed(0)}%</div>

        <div>
          Grid: {viewState.grid.enabled ? 'On' : 'Off'}({viewState.grid.size},
          Snap: {viewState.grid.snap ? 'On' : 'Off'})
        </div>

        <div>Layer: {currentLayerName}</div>

        <div>Tool: {currentTool || 'None'}</div>
      </div>
    </div>
  );
}
