import { useEffect, useRef } from 'react';

const DEFAULT_INTERVAL_MS = 6000;

/**
 * Polls a refresh callback while the tab is visible.
 * Pauses when hidden; runs immediately on focus/visibility restore.
 */
export function useLiveRefresh(callback, options = {}) {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    enabled = true,
    immediate = true,
  } = options;

  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      if (document.hidden || cancelled) {
        return;
      }
      try {
        await callbackRef.current();
      } catch {
        // Ignore transient background sync errors.
      }
    };

    if (immediate) {
      run();
    }

    const intervalId = window.setInterval(run, intervalMs);

    const onVisibilityOrFocus = () => {
      if (!document.hidden) {
        run();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, [intervalMs, enabled, immediate]);
}

export default useLiveRefresh;
