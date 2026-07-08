import { useEffect, useRef } from 'react';

/**
 * Runs a callback on an interval. Stops when the component unmounts.
 * @param callback  Async-safe function to call periodically
 * @param intervalMs  Milliseconds between calls (default 30 000)
 * @param enabled  Whether polling is active (default true)
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs = 30_000,
  enabled = true,
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    // Fire immediately, then on interval
    cbRef.current();
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
