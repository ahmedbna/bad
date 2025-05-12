'use client';

import { useRef, useCallback } from 'react';

/**
 * A hook that creates a throttled version of a function
 * @param callback The function to throttle
 * @param delay The throttle delay in milliseconds
 * @returns The throttled function
 */
export function useThrottledFunction<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  // Use useCallback to memoize the returned function
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgsRef.current = args;

      // If we're still within the throttle period, schedule the execution
      if (now - lastRun.current < delay) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Schedule the function to run when the throttle period ends
        timeoutRef.current = setTimeout(
          () => {
            lastRun.current = Date.now();
            callback(...(lastArgsRef.current as Parameters<T>));
            timeoutRef.current = null;
          },
          delay - (now - lastRun.current)
        );
      } else {
        // We're outside the throttle period, execute immediately
        lastRun.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  );
}
