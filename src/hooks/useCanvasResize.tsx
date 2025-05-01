'use client';

import { useEffect, useState, RefObject } from 'react';

export function useCanvasResize(
  canvasRef: RefObject<HTMLCanvasElement | null>
) {
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1;
    setDpr(devicePixelRatio);

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get the current DPR (it can change, e.g., when moving between monitors)
      const currentDpr = window.devicePixelRatio || 1;

      // Update DPR state if changed
      if (currentDpr !== dpr) {
        setDpr(currentDpr);
      }

      // Get the CSS dimensions
      const rect = canvas.getBoundingClientRect();

      // Adjust canvas dimensions for DPR
      canvas.width = rect.width * currentDpr;
      canvas.height = rect.height * currentDpr;

      // Scale back down using CSS
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Set up the drawing context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Scale drawing operations by the device pixel ratio
        ctx.scale(currentDpr, currentDpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    };

    // Set up initial sizing
    handleResize();

    // Add event listeners for resize
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef, dpr]);

  return dpr;
}
