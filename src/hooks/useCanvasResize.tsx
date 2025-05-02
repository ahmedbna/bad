'use client';

import { useEffect, useState, RefObject } from 'react';

export function useCanvasResize(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>
) {
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get the device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1;
    setDpr(devicePixelRatio);

    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Get the current DPR (it can change, e.g., when moving between monitors)
      const currentDpr = window.devicePixelRatio || 1;

      // Update DPR state if changed
      if (currentDpr !== dpr) {
        setDpr(currentDpr);
      }

      // Define fixed dimensions instead of taking container size
      // This prevents the canvas from filling the entire container
      const canvasWidth = Math.min(container.clientWidth - 20, 1200); // Max width with 20px padding on each side
      const canvasHeight = Math.min(container.clientHeight - 20, 800); // Max height with 20px padding on each side

      // Adjust canvas dimensions for DPR
      canvas.width = canvasWidth * currentDpr;
      canvas.height = canvasHeight * currentDpr;

      // Scale back down using CSS
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      // Set up the drawing context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear any existing transformations
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Scale drawing operations by the device pixel ratio
        ctx.scale(currentDpr, currentDpr);

        // Enable smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Use antialiasing for lines
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
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
  }, [canvasRef, containerRef, dpr]);

  return dpr;
}
