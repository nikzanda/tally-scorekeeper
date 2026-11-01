import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const INITIAL_INTERVAL_MS = 220;
const MIN_INTERVAL_MS = 50;
const ACCELERATION = 0.85;

/**
 * Pressable handlers that run `action` once on tap and repeatedly, with increasing speed,
 * while the button is held down.
 */
export function useRepeatPress(action: () => void) {
  const actionRef = useRef(action);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    actionRef.current = action;
  });

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    let interval = INITIAL_INTERVAL_MS;
    const tick = () => {
      actionRef.current();
      interval = Math.max(MIN_INTERVAL_MS, interval * ACCELERATION);
      timerRef.current = setTimeout(tick, interval);
    };
    tick();
  }, [stop]);

  useEffect(() => stop, [stop]);

  return {
    onPress: () => actionRef.current(),
    onLongPress: start,
    onPressOut: stop,
    delayLongPress: 350,
  };
}
